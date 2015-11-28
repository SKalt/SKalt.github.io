# -*- coding: utf-8 -*-
"""
Created on Thu Nov 26 01:14:38 2015

@author: steven
"""

# import block
from lxml import html
import urllib3 as ul
ul.disable_warnings()
http = ul.PoolManager()
import io
import time
import pandas as pd
import re
import itertools
from datetime import date

#%%
"""
This block generates a list of departments' current course catalog URLs as 
currentCatalogURLs, a list
"""

deptsURL = "https://www.amherst.edu/academiclife/departments"
majorsXPath = '//*[@id="node-214534"]/div/div[1]/div/div/ul/li/a/@href'
tree = html.parse(io.BytesIO(http.request("GET", deptsURL).data))
majorsURLs = tree.xpath(majorsXPath)
currentCatalogURLs = ["www.amherst.edu{}/courses".format(dept) 
                    for dept in majorsURLs]
url = 'www.amherst.edu/academiclife/departments/architectural_studies/courses'
currentCatalogURLs.append(url)
#%%
"""
This gets the current year, uses it to name the previous academic year, and 
then creates a list of all the urls of course catalogs of each department for 
each semester in the current and past academic years.
The automatic year-generation block may be replaceable with manual input, 
in case the user wishes to research a particular set of years.
"""
if date.today().month < 5:
    # it is in the spring
    year3 = date.today().year - 2000 # the current 2-digit year
    year2 = year3 - 1
    year1 = year2 -1
else:        
    # it is in the fall
    year2 = date.today().year - 2000 # the current 2-digit year
    year1 = year2 - 1 # the past year
    year3 = year2 + 1 # the year to come
year1, year2, year3 = str(year1), str(year2), str(year3)

# makes the url suffixes
yearsOfInterest0 = ['/' + year1+year2, '/' + year2+year3]
yearsOfInterest = []
for y in yearsOfInterest0:
    yearsOfInterest.append(y + 'F')
    yearsOfInterest.append(y + 'S')
    
# makes catalogURLs, the list of all the department catalog URLs of interest
catalogURLs = []
for i in currentCatalogURLs:
    for j in yearsOfInterest:
        catalogURLs.append(i + j)
#%%
"""
This block creates a dictionary, courseURLs, mapping departments to the urls of
the courses they include.
"""
path = '//*[@id="academics-course-list"]/' + \
    'div[contains(@class, "coursehead")]/a/@href'

courseURLs = {}
for url in catalogURLs:
    try:
        dept = url.split('/')[3]
        print(dept)
        r = http.request("GET", url).data
        tree = html.parse(io.BytesIO(r))
        if dept not in courseURLs.keys():
            courseURLs[dept] = []
        courseURLs[dept] +=  ['www.amherst.edu' + x for x in tree.xpath(path)]
    except:
        print(url + '!')
#%%
"""
This chunk creates a dictionary mapping the long-form deparment names found in
their departmental catalog urls and so in the courseURLs dictionary to the 
four-digit departmental codes used elsewhere
"""
deptCodes = {}
for k in courseURLs.keys():
    deptCodes[k] = courseURLs[k][0].split('/')[5]

#%% 
"""
This chunk creates a list of the urls of the most recent iterations of all the 
courses observed
"""
uniqueCourseURLs = list(set(list(
                itertools.chain(*[x[1] for x in courseURLs.items()])
                )))
uniqueCourses = list(set([
     '-'.join(url.split('/')[::-1][0].split('-')[0:2]) 
     for url in uniqueCourseURLs
     ]))
     
uniqueRecentURLs = []
for code in uniqueCourses:
    courseURLsList = [url for url in uniqueCourseURLs if code in url]
    dates = []
    for url in courseURLsList:
        year = int(url[len(url) - 3:len(url) - 1])
        if url[len(url)-1:] == 'S':
            year += .1
        dates.append(year)
    for i in enumerate(dates):
        if i[1] == max(dates):
            uniqueRecentURLs.append(courseURLsList[i[0]])
               
#%%
"""
This chunk creates a dictionary, courseDetails, with the following format:
{"CNUM-000":{ "depts" : a list of department codes (for partitioning the nodes 
                        in the visualisation), 
             "url"    : a string linking to the course description in another 
                        tab (for display in the visualisation as a node 
                        attribute)
             "rLine"  : a string of the course title (the label of each node in
                        the visualization)
            }

"""
t0 = time.time()

courseDetails = {}
path = '//*[@id="academics-course-list"]/p/text()'
for url in uniqueRecentURLs:
    r = http.request('GET', url).data
    tree = html.parse(io.BytesIO(r))
    reqline = [t for t in tree.xpath(path) if 'Requisite:' in t]
    code = '-'.join(url.split('/')[::-1][0].split('-')[0:2])
    depts = [key for key, value in courseURLs.items() if url in value]
    courseDetails[code] = {"url":url, "depts":depts, "rLine":reqline}
print(time.time() - t0)
#%%
"""
This chunk creates a dictionary, prereqs, mapping each course code to the 
required courses it names in its  online course description.
"""
prereqs = {}

for k in courseDetails.keys():
    rLine = courseDetails[k]["rLine"]
    if len(rLine) > 0:
        rLine = rLine[0]
        #sentences = rLine.split('.')
        rLine = rLine.replace(u'\xa0', u' ')
        words = re.split(' |-|,|/|;|\.', rLine)
        currentDept = courseDetails[k]["url"].split('/')[5]
        reqdCourses = []
        for word in words:
            if word in depts:
                currentDept = word
            if word.isnumeric() and len(word) == 3:
                prereq = currentDept + '-' + word
                reqdCourses.append(prereq)
        prereqs[k] = reqdCourses       
#%%
"""
This is a test block displaying lines explaining requirements which do not 
contain any course numbers
"""
noShow = [k for k in prereqs.keys() if len(prereqs[k]) == 0]
for k in noShow:
    print(k)
    print(courseDetails[k]['rLine'][0])
    print(prereqs[k])
#%%
# run this ONLY once
"""
This chunk filters out 'empty list' requirements for most of the courses in the
courseDetails dictionary
"""
for k in courseDetails:
    tmp = courseDetails[k]['rLine']
    if len(tmp) > 0 :
        courseDetails[k]['rLine'] = tmp[0]
    else:
        courseDetails[k]['rLine'] = ''
#%%
"""
This chunk filters the list of class numbers to a list of those with 
(parseable) required courses, usedClasses.  This list is then used to subset
the courseDetails dictionary to one containing only courses with requirements
"""
usedClasses = set(list(prereqs.keys()) + [j for j in [i for i in prereqs]])
relevantDetails = {k : courseDetails[k] for k in usedClasses}
#%%
"""
This chunk first transforms the relevantDetails dictionary into a Pandas 
DataFrame, then writes it to the 'courseAttrs' CSV file in the local directory
"""
nodeAttrs = pd.DataFrame.from_dict(courseDetails, orient = 'index')
#nodeAttrs = nodeAttrs.drop('rLine', 1)
nodeAttrs['Id'] = nodeAttrs.index
nodeAttrs.to_csv('courseAttrs.tsv', sep = '\t')

#%%
"""
This chunk creates a list, edgesTempList, of edge tuples created from the 
prereqs dictionary
"""
edgesTempList = [] 
for target in list(prereqs.keys()):
    for source in prereqs[target]:
        edgesTempList.append((source, target))
#%%     
"""
This chunk first transforms the list of edge tuples, edgesTempList, into a 
Pandas DataFrame, then writes it to the 'courseEddgeList' CSV file in the 
local directory
"""
edges = pd.DataFrame(edgesTempList)
edges = edges.rename(columns={0:"Source", 1:"Target"})
edges.to_csv('courseEdgelist.tsv', sep='\t')

#%%
""" 
This chunk creates node/edgelist files for all the departments' courses 
"""
def Subgraph(dept):
    # takes a department string, such as 'theater_dance' and finds all courses
    # which belong to this dept in the courseDetails dict, then writes a tsv
    # edgelist and nodes list of this set
    relevantCourses = {k:courseDetails[k] for k in courseDetails.keys()
                        if dept in courseDetails[k]['depts']}
    nodeAttrs = pd.DataFrame.from_dict(relevantCourses)
    nodeAttrs.to_csv(deptCodes[dept] + 'courseAttrs.tsv', sep = '\t')
    k = relevantCourses.keys()
    b = edges['Source'].isin(k) & edges['Target'].isin(k)
    edgesTempList = edges.loc[b,:]
    edges2 = pd.DataFrame(edgesTempList)
    edges2 = edges2.rename(columns={0:"Source", 1:"Target"})
    edges.to_csv(deptCodes[dept] + 'courseEdgelist.tsv', sep='\t')

for d in deptCodes.keys():
    Subgraph(d)
""" That's all folks! """