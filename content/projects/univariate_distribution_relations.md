---
title: Visualizing relationships between univariate probability distributions
link: https://skalt.github.io/univariate_distribution_relationships/visualize/udr_visualization.html
repo: https://github.com/SKalt/univariate_distribution_relationships
date: 2017-04-03
tags:
  - stats
  - visualization
---

[An experiment][viz] visualizing Leemis and McQueston's [Univariate Distribution Relationships chart][interactive].

<!--more-->

In 1985, Leemis and McQueston published an article
["Univariate Distribution Relationships"][orig] in the American Statistician, an [update][update] in 2008, and in 2012 they published an interactive version of the chart using `area` tags.
In 2017, I wrote a short python script to scrape the data contained in the `area` tags and produce a reuseable and extendable dataset.

You can see the result [here][viz] and the full script and data may be retrieved and reused from [this github repo](https://github.com/SKalt/univariate_distribution_relationships).
If you do reuse the data, please use the citation below for Leemis et al.'s 2008 or 2012 paper and avoid running the scraper unless necessary.

<!--
Leemis, his collaborators, and I have collective put decades into creating this. I've contributed my day or so because I hope building tools that allow students to explore the relationships behind mathematical objects is the best way to retain them. In the future, I may write some script to import the graph to neo4j, though using the Neo4j package with the csvs should be workable</p>
-->

<citation>
  Leemis, Lawrence M, and Jacquelyn T McQueston. 2008. “Univariate Distribution Relationships.” The American Statistician 62 (1): 45–53. doi:10.1198/000313008X270448
</citation>

[viz]: https://skalt.github.io/univariate_distribution_relationships/visualize/udr_visualization.html
[orig]: http://www.tandfonline.com/doi/abs/10.1080/00031305.1986.10475379
[update]: http://www.tandfonline.com/doi/abs/10.1198/000313008X270448
[interactive]: https://www.math.wm.edu/~leemis/chart/UDR/UDR.html
