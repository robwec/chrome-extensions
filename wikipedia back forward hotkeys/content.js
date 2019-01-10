$(document).ready(function () {
    setLocalStorage(); //do this every time you visit a page
    window.addEventListener('keydown', KeyCheck, true);
});

function KeyCheck(e)
{
    var escapetypes = ["text","textarea","search"];
    if (escapetypes.indexOf(document.activeElement.type) !== -1)
        return;
    if (e.ctrlKey & e.shiftKey)
    {
        if (e.keyCode == 87 || e.keyCode == 38) //shift+w, shift+up
            goAllArticles_wow();
        else if (e.keyCode == 82 || e.keyCode == 40) //shift+r, shift+down
            goRandom_all();
        else if (e.keyCode == 65 || e.keyCode == 37) //shift+a, shift+left
            goFirst();
        else if (e.keyCode == 68 || e.keyCode == 39) //shift+d, shift+right
            goNextPage_ofCategoryPage_ifCategoryPage_else_goRandomCategory();
    }
    else if (e.shiftKey)
    {
        if (e.keyCode == 87) //shift+w
            goAllArticles_wow();
        else if (e.keyCode == 82) //shift+r
            goRandom_all();
        else if (e.keyCode == 65) //shift+a
            goFirst();
        else if (e.keyCode == 68) //shift+d
            goNextPage_ofCategoryPage_ifCategoryPage_else_goRandomCategory();
    }
    else
    {
        if (e.keyCode == 87 || e.keyCode == 38) //w, up
            goUp();
        else if (e.keyCode == 82 || e.keyCode == 40) //r, down
            goRandom_withinCategory();
        else if (e.keyCode == 65 || e.keyCode == 37) //a, left
            goPrevious();
        else if (e.keyCode == 68 || e.keyCode == 39) //d, right
            goNext();
    }
}

function goAllArticles_wow()
{
    if (thingisnull(localStorage.lastArticlePage))
        window.location.href = window.location.origin + "/wiki/Special:AllPages";
    else
        window.location.href = window.location.origin + "/w/index.php?title=Special:AllPages&from=" + localStorage.lastArticlePage;
    return;
}

function goNextPage_ofCategoryPage_ifCategoryPage_else_goRandomCategory()
{
    if (pageIsCategoryPage())
        goNextPage_ofCategoryPage();
    else if (pageIsArticlePage())
        goRandomCategory_ofArticlePage();
    return;
}
function goRandomCategory_ofArticlePage()
{
    var categorylist = $('#mw-normal-catlinks').find('a').filter(':gt(0)');
    var nexthref = categorylist[Math.floor(Math.random()*categorylist.length)].href;
    window.location.href = nexthref;
    return;
}

function goFirst()
{
    if (!thingisnull(localStorage.activeCategoryTitle))
        window.location.href = window.location.origin + "/wiki/" + "Category:" + localStorage.activeCategoryTitle;
    return;
}

function goRandom_all()
{
    window.location.href = window.location.origin + "/wiki/Special:Random";
    return;
}
function goRandom_withinCategory()
{
    var nexthref = window.location.origin + "/wiki/Special:RandomInCategory/";
    if (!thingisnull(localStorage.activeCategoryTitle))
    {
        nexthref += localStorage.activeCategoryTitle;
        window.location.href = nexthref;
    }
    return;
}

function goNextPage_ofCategoryPage()
{
    if (!pageIsCategoryPage())
        goUp();
    var nexthref = $('a:contains("next page")')[0];
    if (nexthref !== undefined)
    {
        nexthref = nexthref.href;
        window.location.href = nexthref;
    }
    return;
}
function goPreviousPage_ofCategoryPage()
{
    if (!pageIsCategoryPage())
        goUp();
    var nexthref = $('a:contains("previous page")')[0];
    if (nexthref !== undefined)
    {
        nexthref = nexthref.href;
        window.location.href = nexthref;
    }
    return;
}

function goNext()
{
    if (pageIsArticlePage())
        goNextArticle_fromArticlePage();
    else if (pageIsCategoryPage())
        goNextArticle_fromCategoryPage();
    return;
}
function goNextArticle_fromCategoryPage()
{
    var currentarticletitle = localStorage.lastArticlePage;
    //var allvalidarticlestogoto_hrefs = $('.mw-category-group').find('ul').find('li').find('a');
      //fails on some category pages, like https://en.wikipedia.org/wiki/Category:Ayr,_Queensland
    //var allvalidarticlestogoto_hrefs = $('#mw-pages > .mw-content-ltr').find('li').find('a');
    var allvalidarticlestogoto_hrefs = findcategorylinksjquerypattern();
      //works there, but what about on bigger category pages? ... well, it seems to work on everything. Okay.
    var allvalidarticlestogoto_titles = hrefstoarticles(allvalidarticlestogoto_hrefs);
    var nexturl;
    if (currentarticletitle === undefined || currentarticletitle === "undefined" || currentarticletitle === "")
    {
        nexturl = allvalidarticlestogoto_hrefs[0];
        window.location.href = nexturl;
    }
    else
    {
        var foundpos = allvalidarticlestogoto_titles.indexOf(currentarticletitle);
        if (foundpos === -1)
        {
            nexturl = allvalidarticlestogoto_hrefs[0];
            window.location.href = nexturl;
        }
        else if (foundpos < allvalidarticlestogoto_titles.length - 1)
        {
            nexturl = allvalidarticlestogoto_hrefs[foundpos+1];
            window.location.href = nexturl;
        }
        else
            goNextPage_ofCategoryPage();
    }
    if (categorylist.indexOf(currentcategory) !== -1)
        goUp_articlePage();
    return;
}
function hrefstoarticles(alist)
{
    var hrefs = [];
    for (var i=0;i<alist.length;i++)
    {
        //var thishref = alist[i].href.split("/"); //[4]
        //thishref = thishref[thishref.length - 1];
          //but this is bad, because sometimes an article can have /'s in the title, like 7/8/03_–_New_York,_New_York
        var thishref = alist[i].href.split("/");
        thishref = thishref.slice(4).join("/");
        //add any # at end. ... no, wait, that was added by a javascript, so this won't get it. Darn.
        //thishref += alist[i].hash;
        hrefs.push(thishref);
    }
    return hrefs;
}
function findcategorylinksjquerypattern()
{
    return $('#mw-pages > .mw-content-ltr').find('li').find('a');
}
//
function goNextArticle_fromArticlePage()
{
    var categorylist = articlePage_getCategories();
    var currentcategory = localStorage.activeCategoryTitle;
    var articletitlelist = localStorage.articleTitleList.split("|||");
    var foundpos = articletitlelist.indexOf(localStorage.lastArticlePage);
    if (foundpos === -1)
        goUp_articlePage();
    else if (foundpos === articletitlelist.length - 1)
        goUp_articlePage();
    else
    {
        var nexttitle = articletitlelist[foundpos + 1];
        var nexturl = window.location.origin + "/wiki/" + nexttitle;
        window.location.href = nexturl;
    }
    return;
}
function articlePage_getCategories()
{
    var categorylist = $('#mw-normal-catlinks').find('a').filter(':gt(0)');
    categorylist = hrefstocategories(categorylist);
    return categorylist;
}
function hrefstocategories(alist)
{
    var hrefs = [];
    for (var i=0;i<alist.length;i++)
    {
        var thishref = alist[i].href.split(":");
        //thishref = thishref[thishref.length - 1]; //just in case some category has colon, use the following method instead
        thishref = thishref.slice(2).join(":");
        hrefs.push(thishref);
    }
    return hrefs;
}

function goPrevious()
{
    if (pageIsArticlePage())
        goPreviousArticle_fromArticlePage();
    else if (pageIsCategoryPage())
        goPreviousArticle_fromCategoryPage();
    return;
}
function goPreviousArticle_fromCategoryPage()
{
    var currentarticletitle = localStorage.lastArticlePage;
    //var allvalidarticlestogoto_hrefs = $('.mw-category-group').find('ul').find('li').find('a');
    var allvalidarticlestogoto_hrefs = findcategorylinksjquerypattern();
    var allvalidarticlestogoto_titles = hrefstoarticles(allvalidarticlestogoto_hrefs);
    var nexturl;
    if (currentarticletitle === undefined || currentarticletitle === "undefined" || currentarticletitle === "")
    {
        nexturl = allvalidarticlestogoto_hrefs[0];
        window.location.href = nexturl;
    }
    else
    {
        var foundpos = allvalidarticlestogoto_titles.indexOf(currentarticletitle);
        if (foundpos === -1)
        {
            nexturl = allvalidarticlestogoto_hrefs[allvalidarticlestogoto_hrefs.length - 1];
            window.location.href = nexturl;
        }
        else if (foundpos > 0)
        {
            nexturl = allvalidarticlestogoto_hrefs[foundpos-1];
            window.location.href = nexturl;
        }
        else
            goPreviousPage_ofCategoryPage();
    }
    if (categorylist.indexOf(currentcategory) !== -1)
        goUp_articlePage();
    return;
}
function goPreviousArticle_fromArticlePage()
{
    var categorylist = articlePage_getCategories();
    var currentcategory = localStorage.activeCategoryTitle;
    var articletitlelist = localStorage.articleTitleList.split("|||");
    var foundpos = articletitlelist.indexOf(localStorage.lastArticlePage);
    if (foundpos === -1)
        goUp_articlePage();
    else if (foundpos === 0)
    {
        //set last article to blank so it will go to the first one instead of the second one, when I press forward again
        localStorage.lastArticlePage = "";
        goUp_articlePage();
    }
    else
    {
        var nexttitle = articletitlelist[foundpos - 1];
        var nexturl = window.location.origin + "/wiki/" + nexttitle;
        window.location.href = nexturl;
    }
    return;
}

function goUp()
{
    if (pageIsArticlePage())
        goUp_articlePage();
    else if (pageIsCategoryPage())
        goUp_categoryPage();
    return;
}
function goUp_articlePage()
{
    if(localStorage.activeCategoryTitle !== undefined && localStorage.activeCategoryTitle !== "undefined" && localStorage.activeCategoryTitle !== "")
    {
        var nexturl;
        if (thingisnull(localStorage.subcatfrom) && thingisnull(localStorage.pagefrom) && thingisnull(localStorage.pageuntil))
            nexturl = window.location.origin + "/wiki/" + "Category:" + localStorage.activeCategoryTitle;
        else if (!thingisnull(localStorage.pagefrom))
        {
            nexturl = window.location.origin + "/w/index.php?title=" + "Category:" + localStorage.activeCategoryTitle;
            nexturl += "&pagefrom=" + localStorage.pagefrom;
        }
        else if (!thingisnull(localStorage.subcatfrom))
        {
            nexturl = window.location.origin + "/w/index.php?title=" + "Category:" + localStorage.activeCategoryTitle;
            if (localStorage.subcatfrom !== undefined && localStorage.subcatfrom !== "")
                nexturl += "&subcatfrom=" + localStorage.subcatfrom + "#mw-subcategories";
        }
        else if (!thingisnull(localStorage.pageuntil))
        {
            nexturl = window.location.origin + "/w/index.php?title=" + "Category:" + localStorage.activeCategoryTitle;
            nexturl += "&pageuntil=" + localStorage.pageuntil;
        }
        window.location.href = nexturl;
    }
    return;
}
function thingisnull(athing)
{
    return (athing === undefined || athing === "undefined" || athing === "");
}
function goUp_categoryPage()
{
    if(localStorage.lastArticlePage !== undefined && localStorage.lastArticlePage !== "")
    {
        var nexturl = window.location.origin + "/wiki/" + localStorage.lastArticlePage;
        window.location.href = nexturl;
    }
    return;
}

function setLocalStorage()
{
    if (pageIsCategoryPage())
    {
        //when the category page is new, clear the pageuntil, pagefrom, subcatfrom entries. Do this before storing the new category.
        var oldtitle = localStorage.activeCategoryTitle;
        if (pageHasQueryString())
        {
            var queryobject = readQueryString_toObject();
            //localStorage.activeCategoryTitle = queryobject.title.split(":")[1];
            localStorage.activeCategoryTitle = queryobject.title.split(":").slice(1).join(":");
            if (queryobject.hasOwnProperty("pageuntil"))
                localStorage.pageuntil = queryobject.pageuntil;
            else if (queryobject.hasOwnProperty("subcatfrom"))
            {
                localStorage.subcatfrom = queryobject.subcatfrom;
                localStorage.pagefrom = "";
            }
            else if (queryobject.hasOwnProperty("pagefrom"))
            {
                localStorage.pagefrom = queryobject.pagefrom;
                localStorage.subcatfrom = "";
            }
        }
        else
        {
            //localStorage.activeCategoryTitle = window.location.pathname.split("/")[2].split(":")[1];
            localStorage.activeCategoryTitle = window.location.pathname.split("/")[2].split(":").slice(1).join(":");
            localStorage.subcatfrom = "";
            localStorage.pagefrom = "";
        }
        if (oldtitle !== localStorage.activeCategoryTitle)
        {
            localStorage.pageuntil = "";
            localStorage.pagefrom = "";
            localStorage.subcatfrom = "";
        }
        //set page link list for back/forward
        //var linkies = $('.mw-category-group').find('ul').find('li').find('a');
        var linkies = findcategorylinksjquerypattern();
        linkies = hrefstoarticles(linkies);
        localStorage.articleTitleList = linkies.join("|||"); //can't store as list, it gets comma separated.
    }
    else if (pageIsArticlePage())
        //localStorage.lastArticlePage = window.location.pathname.split("/")[2];
        localStorage.lastArticlePage = window.location.pathname.split("/").slice(2).join("/");
    return;
}
function pageIsCategoryPage()
{
    //have to handle two cases:
    //https://en.wikipedia.org/wiki/Category:something
    //https://en.wikipedia.org/w/index.php?title=Category:Albums_by_producer
    if (window.location.pathname === "/w/index.php")
    {
        var queryobject = readQueryString_toObject();
        return queryobject.title.split(":")[0] === "Category";
    }
    else
        return window.location.pathname.split("/")[2].split(":")[0] === "Category";
}
function pageIsArticlePage()
{
    //https://en.wikipedia.org/wiki/something
    //for a proxy, let's just use that it has something without a colon after the /wiki/
    //... and that would be a wrong proxy because some pages do have colons.
    //return window.location.pathname.search(":") === -1;
    //well, uh, let's make a slightly different assumption that it doesn't contain Category:
    //return window.location.pathname.search("Category:") === -1;
      //this doesn't work on the index.php page. Hm.
    if (window.location.pathname === "/w/index.php")
        return false;
    else
        return window.location.pathname.search("Category:") === -1;
}
function pageHasQueryString()
{
    return window.location.pathname === "/w/index.php";
}
function readQueryString_toObject()
{
    var myobject = {};
    if (window.location.search.length < 1)
        return myobject;
    var myquerystring = window.location.search.substring(1);
    var myquery_amparray = myquerystring.split("&");
    myquery_amparray = myquery_amparray.map(x => x.split("="));
    for (var i=0;i<myquery_amparray.length;i++)
        myobject[myquery_amparray[i][0]] = myquery_amparray[i][1];
    return myobject;
}