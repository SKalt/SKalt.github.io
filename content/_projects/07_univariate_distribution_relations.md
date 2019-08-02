---
id: udr-relationships
title: Relationships between univariate probability distributions
is_code: false
link: https://skalt.github.io/univariate_distribution_relationships/visualize/udr_visualization.html
---

In 1985, Leemis and McQueston published an article
"<a href="http://www.tandfonline.com/doi/abs/10.1080/00031305.1986.10475379" target="\_blank" rel="noreferrer">Univariate Distribution Relationships</a>" in the American Statistician, an <a href="http://www.tandfonline.com/doi/abs/10.1198/000313008X270448" target="\_blank" rel="noreferrer">update</a>
in 2008, and in 2012 they published an interactive version of the
chart using `area` tags.  In 2017, I wrote a short python
script to scrape the data contained in the `area` tags
and produce a reuseable and extendable dataset.  The result is
<a href="#udr-demo">below.</a>


The full visualization can be viewed <a href="{{ link }}" target="\_blank" rel="noreferrer">here</a>
and the full script and data may be retrieved and reused from <a href="https://github.com/SKalt/univariate_distribution_relationships" target="\_blank"> this github repo</a>.  If you do reuse the data, please use the citation below for Leemis et al.'s 2008 or 2012 paper and avoid running the scraper unless neccessary.

<!--
Leemis, his collaborators, and I have collective put decades into creating this. I've contributed my day or so because I hope building tools that allow students to explore the relationships behind mathematical objects is the best way to retain them. In the future, I may write some script to import the graph to neo4j, though using the rneo4j package with the csvs should be workable</p>
-->
<citation>
  Leemis, Lawrence M, and Jacquelyn T McQueston. 2008. “Univariate Distribution Relationships.” The American Statistician 62 (1): 45–53. doi:10.1198/000313008X270448
</citation>
