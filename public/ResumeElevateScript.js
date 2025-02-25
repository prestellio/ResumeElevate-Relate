
//Moves the user to the generate.html page
function toGenerator() {
    window.location.href="generate.html";
}
//Button with id="generator" in index.html
document.getElementById("generator").addEventListener("click", toGenerator);

//Nav bar collapse
function toggleNav() {
    var navList = document.getElementById("nav-btn");
    if (navList.style.display === "none" || navList.style.display === "") {
        navList.style.display = "flex";
    } else {
        navList.style.display = "none";
    }
}

document.getElementById('navbarToggle').addEventListener('click', function() {
    var menu = document.getElementById('navbarMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
});
