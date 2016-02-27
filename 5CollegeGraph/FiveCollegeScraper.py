# -*- coding: utf-8 -*-
"""
Created on Fri Feb 26 16:21:27 2016

@author: steven
"""

# -*- coding: utf-8 -*-
"""
This module defines and runs functions which scrape the Amherst College
departmental course catalogs to create a file, data.json, which plugs
into the Oxford Internet Institute's interactive network viewer.  This
file contains the node and edge attributes of the network of prerequisites
at Amherst College: which courses are required by which.

Created on Mon Jan 11 13:26:45 2016

@author: steven
"""

# import block
import shutil
from lxml import html
import urllib3 as ul
ul.disable_warnings()
HTTP = ul.PoolManager()
import io
#import time
import re
import itertools
from datetime import date
import igraph
import json
import os
from random import randint
from collections import OrderedDict

#from ExploreElement import explore_element

#%% testing
#query_url = "https://www.fivecolleges.edu/academics/courses?" + \
#"field_course_semester_value=S&" + \
#"field_course_year_value=2016&" + \
#"field_course_institution_value%5B%5D={}&" + \
#"title=&" + \
#"course_instructor=&" + \
#"body_value=&" + \
#"field_course_number_value=&" + \
#"field_course_subject_name_value=&" + \
#"field_course_subject_value="
#
#institution = "S"
#data = HTTP.request("GET", query_url.format(institution)).data
#tree = html.parse(io.BytesIO(data))
#
#xp = '//*[@class="view-content"]/table["views-table sticky-enabled cols-7 ' + \
#'tableheader-processed sticky-table"]/tbody/tr'
#%%
#def test(url):
#    data = HTTP.request("GET", url).data
#    tree = html.parse(io.BytesIO(data))
#    return(tree)
#%%
def get_institution_course_urls(institution_course_codes = None,
                                semester = 'S',
                                year = 2016):
    """
    This function returns a list of institutions' current course 
    offerings' course page urls as current_catalog_urls, a list
    Args:
        institution_course_codes : a dict mapping each institution code to
            to their course codes, which in turn map to the courses' details
        semester: the semester whose courses are to be appended to 
            institution_course_codes
        year: the year whose courses are to be appended to 
            institution_course_codes

    Returns:
        institution_course_codes : a dict of institutions first letters (i.e.
            U, M, A, S, H), mapping to dicts of institutions' course codes to
            their most recent url.
    """
    # define dict to be returned if none supplied
    if institution_course_codes == None:
        institution_course_codes = {
            # a dict of lists of unique course codes at each institution
            "U" : {},
            "M" : {},
            "A" : {},
            "S" : {},
            "H" : {}
            }
    # define address strings
    query_url = "https://www.fivecolleges.edu/academics/courses?" + \
    "field_course_semester_value={semester}&" + \
    "field_course_year_value={year}&" + \
    "field_course_institution_value%5B%5D={institution}&" + \
    "title=&" + \
    "course_instructor=&" + \
    "body_value=&" + \
    "field_course_number_value=&" + \
    "field_course_subject_name_value=&" + \
    "field_course_subject_value="
    next_page_link_xpath = '//*[@class="pager-next"]/a/@href' #tested; works
    courses_table_row_xpath = '//*[@class="view-content"]/' + \
    'table["views-table sticky-enabled cols-7 ' + \
    'tableheader-processed sticky-table"]/tbody/tr'
    # define the dict to be returned
    
    institution_queries = [
        "U", # umass
        "M", # MHC
        "A", # amherst
        "H", # hampshire
        "S"] # smith
    # get all catalog pages' info
    for institution in institution_queries:
        url = query_url.format(semester = semester,
                               year = year,
                               institution = institution)
        data = HTTP.request("GET", url).data
        tree = html.parse(io.BytesIO(data))
        last_page = False # in fact this is the first page when set
        while last_page == False:
            if tree.xpath(next_page_link_xpath) == []:
                last_page = True
            else: next_url = 'https://www.fivecolleges.edu/' + \
                tree.xpath(next_page_link_xpath)[0]
            course_rows = tree.xpath(courses_table_row_xpath)
            for course_row in course_rows:
                row_elements = [i.text for i in course_row]
                dept = row_elements[0].strip() 
                num = row_elements[1].strip()
                code = dept + '-' + num
                course_rows = tree.xpath(courses_table_row_xpath)
                if code not in institution_course_codes[institution].keys():
                    tmp = OrderedDict()
                    tmp["title"] = course_row[4].xpath('./a/text()')[0]
                    tmp["url"] = 'https://www.fivecolleges.edu/' + \
                        course_row[4].xpath('./a/@href')[0]
                    tmp["times"] = row_elements[6].strip()
                    tmp["date"] = '{}{}'.format(year, semester)
                    tmp["date_checked"] = str(date.today())
                    institution_course_codes[institution][code] = tmp 
            data = HTTP.request("GET", next_url).data
            tree = html.parse(io.BytesIO(data))
    return institution_course_codes
#%%
def get_course_description(institutions):
    """
    This function adds course description information to the dict 
    institution_course_codes
    Args:
        institutions : a dict mapping each institution to codes, 
            which in turn map to dicts of course details.  
    Returns:
        institution_course_codes: as above, with added course details
    """
    for institution in institutions.keys():
        print(institution)
        left = len(institutions[institution])
        counter = 0
        for course in institutions[institution].keys():
            counter += 1
            if 'description' not in institutions[institution][course].keys():
                url = institutions[institution][course]["url"]
                data = HTTP.request("GET", url).data
                tree = html.parse(io.BytesIO(data))
                tmp = tree.xpath('//*[@class="field-item even"]/text()')
                tmp = '\n'.join(tmp)
                prereqs = []
                for s in tmp:
                  if 'requisite' or 'or consent of professor' in s:
                      prereqs.append(s)
                institutions[institution][course]["description"] = tmp
                institutions[institution][course]["prereqs"] = prereqs
            if (left - counter) % 100 == 0:
                print(left - counter)
    return(institutions)
#%%
def get_prereqs(catalog_dict):
    """
    This function creates a dictionary, prereqs, mapping each course code to
    the required courses it names in its  online course description.
    Args:
        catalog_dict: a dict mapping all the codes in a university's course 
            catalog to course details
        marker: a list of strings marking the starting point of the sentence in
          a course's description containing the codes of the course's prereqs.
    Returns:
        prereqs: a list of edge tuples (code of course required, code of course
        requiring)
    """
    prereqs = []
    depts = [i.split('-')[0].upper() for i in catalog_dict.keys()]
    nums = [i.split('-')[1].upper() for i in catalog_dict.keys() if i.split('-')[1][0].isnumeric()]
    # search the line describing requirements for course codes
    for k in catalog_dict.keys():
        desc = catalog_dict[k]["description"] # a string
        req_line = ''
        if len(desc) > 0:
            desc = desc.replace(u'\xa0', u' ')
            sentences = [i for i in re.split('\n|\.', desc)]
            for i in sentences:
                if 'requisite' or 'or consent of professor' in i.lower():
                    req_line +=  i + ' '
            words = re.split(' |-|,|/|;|\.', req_line)
            current_dept = k.split('-')[0]
            # ^ assume a course is most likely to require another in its own
            # department
            for word in words:
                if word.upper() in depts:
                    current_dept = word
                if word in nums:
                    prereqs.append((current_dept.upper() + '-' + word, k))
    return(prereqs)
#%%
def test_prereqs(prereqs_edgelist, course_details):
    """
    This function tests the edgelist of prereq relationships, displaying lines
    explaining requirements which do not contain any course numbers
    Args:
        prereqs_edgelist: a list of tuples mapping course numbers AT AN
            INSTITUTION to the codes of their prerequisites
        course_details: a list of tuples mapping course numbers AT AN
            INSTITUTION to a dict of its details
    Returns:
        nuthin'; prints any places where there should be prereqs but there are
        none detected.
    """
    counter = 0
    for k in course_details.keys():
        if k not in itertools.chain(*prereqs_edgelist):
            if len(course_details[k]["prereqs"]) > 0:
                counter += 1
                print(k)
                print(course_details[k]["prereqs"])
    print(counter)
#%%
def make_course_graph(course_details, prereqs_edgelist):
    """
    Makes an igraph Graph object, complete_course_graph, from the edgelist of
    prerequisite relations and the total number of courses and makes the
    object global.
    Args:
        course_details: a dict mapping course numbers AT AN INSTITUTION to a
            dict of its details
        prereqs_edgelist: a list of edge tuples mapping course numbers AT AN 
            INSTITUTION to the codes of its prerequisites
    Returns:
        a directed acyclic igraph object representing all the requirement
        relations at one institution
    """
    # count the number of required courses not in 'course_details'
    all_courses = itertools.chain(*prereqs_edgelist)
    extra_courses = [c for c in all_courses if c not in course_details.keys()]
    number_of_courses = len(extra_courses) + len(course_details)
    
    # create an empty graph with all the courses as nodes, then add prereq
    # relations from the prereqs edgelist
    names_of_courses = list(course_details.keys()) + extra_courses
    complete_course_graph = igraph.Graph(number_of_courses, directed = True)
    complete_course_graph.vs["name"] = names_of_courses
    complete_course_graph.add_edges(prereqs_edgelist)
    return(complete_course_graph)

def make_subgraph(dept_string, prereqs_edgelist, course_graph):
    """
    takes a department string, and finds all courses in this department or
    required by the department, and create a new igraph object from these
    courses and their relationships.
    Args:
        dept_string: a string specifying a department code
        prereqs_edgelist: a list of tuples mapping course codes to the codes 
            of their prerequisites at an institution
        complete_course_graph: an igraph object of all the prerequisite 
            relations at that institution
    Returns:
        the same 
    """
    # get a list of courses relevant to the department
        
    relevant_courses = []
    for i in enumerate(course_graph.vs["name"]):
        if i[1].split('-')[0] == dept_string:
            relevant_courses.append(i)
    neighbors = course_graph.neighborhood([i[0] for i in relevant_courses])
    relevant_courses = list(set(itertools.chain(*neighbors)))
    return(course_graph.induced_subgraph(relevant_courses))

def get_sugiyama_layout(subgraph):
    """
    This function sorts a prerequisites graph into 100,200,300, and 400-level
    classes, then returns the x and y positions of each node in that layout
    Args:
        subgraph: a graph of course prerequisite relations with course codes as
            vertex names 
    Returns:
        a list of tuples specifying x and y coordinates of each node in the
        graph in a sugiyama layout for directed acyclic graphs.
    """
    # get a list of course levels corresponding to each course-node
#    course_levels = []
#    for course_name in subgraph.vs["name"]:
#        done = False
#        i = 0
#        while done == False and i < len(course_name):
#            if course_name[i].isnumeric():
#                done = True
#                course_levels.append(int(course_name[i]))
#            i += 1
#        if i < len(course_name): course_levels.append(0)

#    course_levels = []
#    for course_name in subgraph.vs["name"]:
#        for letter in course_name:
#            if letter.isnumeric():
#                course_levels.append(int(letter))
#                break
#    if len(course_levels) != subgraph.vcount():
#        # get the layout object
#        print(len(course_levels))
#        print(subgraph.vcount())
#        return('')
    sugiyama_layout = subgraph.layout_sugiyama(maxiter=1000)
    sugiyama_layout = sugiyama_layout[0:subgraph.vcount()]
    return sugiyama_layout

def make_color():
    "returns a number between 0 and 255"
    return randint(0, 255)

def get_rgb():
    "returns a tuple of three numbers between 0 and 255"
    return (make_color(), make_color(), make_color())

def make_json(dept_string, course_details, complete_course_graph):
    """
    This function makes a JSON object called 'data', to be inserted
    into the directory exported by a sigma.js template to
    make an interactive web visualization of the prereqs network
    Args:
        dept_string: a string specifying a department at an institution
        course_details: a dict mapping course codes to course details at an
            institution
        complete_course_graph: a directed igraph object containing all the 
            courses at the institution as nodes and all the requirements of 
            each course as the first-order in-neigbhors of the course
    Returns:
        data: a  JSON file specifying the nodes and edges to be drawn by
            sigma.js and the information about nodes to display.
    """
    data = {"edges":[], "nodes":[]}
    
    #get the subgraph, node positions
    subgraph = make_subgraph(dept_string, \
                             course_details, \
                             complete_course_graph)
    sugiyama_layout = get_sugiyama_layout(subgraph)

    unique_departments = [name.split('-')[0] for name in subgraph.vs["name"]]
    department_colors = {dept:get_rgb() for dept in unique_departments}

    for node in enumerate(subgraph.vs["name"]):
        if node[1] in course_details.keys():
            node_output = OrderedDict()
            node_output["label"] = node
            node_output["x"] = sugiyama_layout[node[0]][0]
            node_output["y"] = sugiyama_layout[node[0]][1]
            node_output["id"] = str(node)
            
            attrs = OrderedDict()
            attrs["Title"] = course_details[\
                node[1]]["title"]
            attrs["Description"] = course_details[node[1]]["description"]                
            attrs["Department Code"] = node[1][0:4]
            attrs["Course Site"] = \
                "<a href= '" + \
                course_details[node[1]]["url"] + \
                "'> Course Site </a>"
            attrs["Requisite"] = course_details[node[1]]["prereqs"]
            node_output["attributes"] = attrs

            node_output["color"] = 'rgb' + \
                str(department_colors[node[1].split('-')[0]])
            node_output["size"] = 10.0 
        # if the course has no retrieved details:
        else:
            node_output = OrderedDict()
            node_output["label"] = node
            node_output["x"] = sugiyama_layout[node[0]][0]
            node_output["y"] = sugiyama_layout[node[0]][1]
            node_output["id"] = str(node)
            node_output["attributes"] = OrderedDict()
            node_output["attributes"]["Title"] = node
            node_output["attributes"]["Description"] = 'not offered in the' + \
                " last 4 semesters"
            node_output["attributes"]["Department Code"] = node[1].split('-')[0]
            node_output["attributes"]["Course Site"] = ""
            node_output["attributes"]["Requisite"] = ''
            node_output["color"] = 'rgb' + str(department_colors[node[1].split('-')[0]])
            node_output["size"] = 10.0
        data["nodes"].append(node_output)

    edgelist = subgraph.get_edgelist()
    for edge in enumerate(edgelist):
        color = department_colors[subgraph.vs["name"][edge[1][1]].split('-')[0]]
        color = 'rgb' + str(color)
        edge_output = OrderedDict()
        edge_output["label"] = ''
        edge_output["source"] = str(edge[1][0])
        edge_output["target"] = str(edge[1][1])
        edge_output["id"] = str(len(node_output) - 1 + 2*edge[0])
        #                                        ^ this is to conform with the
        # odd indexing I see in working visualisations
        edge_output["attributes"] = {}
        edge_output["color"] = color # target node color
        edge_output["size"] = 1.0
        data["edges"].append(edge_output)
    return data

def find_or_make_directory_address(inst_code, dept_string):
    """
    finds whether there is a directory named after a deptarment string, and
    if not, makes one
    Args:
        inst_code: U for UMass, A for Amherst, etc.
        dept_string: a string specifying a department at an institution
    Returns:
        a string specifying an directory
    """
    directory = './{}/{}'.format(inst_code, dept_string)
    if not os.path.exists(directory):
        shutil.copytree('../AmherstGraph/NetworkTemplateWithoutData_JSON',
                        directory)
    return directory

def export_json(inst_code, dept_string, course_details, complete_course_graph):
    """
    writes the data json object describing a major's prerequisite network to
    a file called 'data.json' in a directory named after the department
    Args:
        inst_code: U for UMass, A for Amherst, etc.
        dept_string: a string specifying a department at an institution
        course_details: a dict mapping course codes to course details at an
            institution
    Returns:
        None
    """
    data = make_json(dept_string, course_details, complete_course_graph)
    path = find_or_make_directory_address(inst_code, dept_string)
    path += '/data.json'
    json_file = json.dumps(data, separators=(',', ':'))
    target_file = open(path, 'w')
    target_file.write(json_file)
    target_file.close()

#%% run the code
if __name__ == "__main__":
#    T = open('temp')  # for temp
#    INST = json.loads(T.read())
#    T.close()
    # this will have to be modified to update the years to scrape.  For now,
    # I'm loading the pre-scraped version
#    INST = get_institution_course_urls()
#    print(1)
#    INST = get_institution_course_urls(INST, 'F', '2015')
#    print(1)
#    INST = get_institution_course_urls(INST, 'S', '2015')
#    print(1)
#    INST = get_institution_course_urls(INST, 'F', '2014')
#    print(1)
#    INST = get_course_description(INST)
    print('Nearly there...')
    for i in ['S', 'U','M','H']: # I've got A covered at the moment
        DEPTS = list(set([k.split('-')[0] for k in INST[i].keys()]))
        PREREQS = get_prereqs(INST[i])
        test_prereqs(PREREQS, INST[i])
        print('^TESTING PREREQS; # courses missing prereqs')
        COURSE_GRAPH = make_course_graph(INST[i], PREREQS)
        for dept in DEPTS:
            export_json(i, dept, INST[i], COURSE_GRAPH)
            print(dept + ' done')
#    T = open('temp','w')
#    T.write(json.dumps(INST, separators=(',', ':')))
#    T.close()
print(""" That's all folks! """)
#%% temp manual debugging section
#CURRENT_CATALOG_URLS = get_catalog_urls()
#CATALOG_URLS = get_date(CURRENT_CATALOG_URLS)
#COURSE_URLS = get_courses(CATALOG_URLS)
#UNIQUE_RECENT_URLS = get_most_recent_course_urls(COURSE_URLS)
#COURSE_DETAILS = get_course_info(UNIQUE_RECENT_URLS, COURSE_URLS)
#PREREQS = get_prereqs(COURSE_DETAILS)
#test_prereqs(PREREQS, COURSE_DETAILS)
#COMPLETE_COURSE_GRAPH = make_course_graph(COURSE_DETAILS, PREREQS)
#for temp_dept_string in DEPT_CODES.keys():
#    subgraph = make_subgraph(temp_dept_string, COURSE_DETAILS, \
#                               COMPLETE_COURSE_GRAPH)
#    print(temp_dept_string)
#    print(subgraph.ecount())
#    export_json(temp_dept_string, COURSE_DETAILS, COMPLETE_COURSE_GRAPH)
#    print(temp_dept_string + ' done')
