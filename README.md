Widgets, Views, &amp; Tools for Famo.us
======



##RefreshScrollView:

A pull to refresh scrollview. I tried to give the user as many options as possible without getting redicules. We will be posting an example page that shows usage soon.

Thanks to John Traver for the basics.
http://stackoverflow.com/questions/24527713/scrollview-pull-to-refresh-famo-us/24567079#24567079

##PageSwipe: (NOT DONE REFACTORING)

This works wonderful inside a current project. We are currently refactoring it into a reusable view. Hopefully it will be ready in a day or so as we have time.

Using a scrollview for side to side pagination is troublesome. With a strong slide it will paginate more than one page at a time. If all the logic and effects were inside the scroll it was alright but if you needed to know what your index was or monitor the swipes things started to get buggy. Things like changing the header dependent on the current index or if your pagination wasn't inside the scroll. This is more of a hack than a widget. I'm sure a little more regular scrollview love will make this obsolete.