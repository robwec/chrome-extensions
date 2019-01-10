$(document).ready(function () {
    var originaltitle = document.title;

    function favicondefault()
    {
        var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = document.location.origin + '/favicon.ico';
        document.getElementsByTagName('head')[0].appendChild(link);
        return;
    }

    favicondefault();
    setInterval(function(){ document.title = originaltitle;}, 100);
    setInterval(function(){ favicondefault();}, 100);
});
