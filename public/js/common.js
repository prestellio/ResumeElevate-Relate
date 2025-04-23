// Common navigation functions
function toggleNav() {
    var navList = document.getElementById("nav-btn");
    if (navList.style.display === "none" || navList.style.display === "") {
        navList.style.display = "flex";
    } else {
        navList.style.display = "none";
    }
}

// Nav bar mini-button toggle
document.addEventListener('DOMContentLoaded', function() {
    // Check if navbarToggle exists before adding event listener
    NavigationGeneration();
    const navbarToggle = document.getElementById('navbarToggle');
    if (navbarToggle) {
        navbarToggle.addEventListener('click', function() {
            var menu = document.getElementById('navbarMenu');
            if (menu.style.display === 'block') {
                menu.style.display = 'none';
            } else {
                menu.style.display = 'block';
            }
        });
    }
});

// Navigation function to the questionnaire page
function toGenerator() {
    window.location.href = "questionnaire.html";
}

// Generate the navigation bar for pages
function NavigationGeneration() {
    let pages = ["index.html","questionnaire.html","about.html", "login.html", "editor.html"];
    let pageTitle = ["Home", "Generate Resume", "About", "Login page", "Edit Resume"];

    let header = document.getElementById("top");
    let link = document.createElement('a');
    let img = document.createElement('img');

    link.setAttribute('href', 'index.html');

    img.setAttribute('src', '../images/RelateLogo_proto_square.png');
    img.setAttribute('alt', 'Resume Relate Logo: green and blue peacock');

    link.appendChild(img);
    header.appendChild(link);

    let nav = document.createElement('nav');
    let btn = document.createElement('button');
    let div = document.createElement('div');

    nav.setAttribute('class', 'navbar');

    btn.setAttribute('class','navbar-toggle');
    btn.setAttribute('id', 'navbarToggle');
    btn.innerHTML = '&#9776;';

    nav.appendChild(btn);

    div.setAttribute('class', 'navbar-menu');
    div.setAttribute('id', 'navbarMenu');

    let count = 0;
    let currentPage = window.location.pathname.split("/").pop();

    pages.forEach ( page => {
        let a = document.createElement('a');

        a.setAttribute('class', 'nav-link');
        a.setAttribute('href', page);

        if(page == currentPage){
            a.classList.add('active');
        }

        a.innerHTML = pageTitle[count];

        div.appendChild(a);

        count += 1
    });

    nav.appendChild(div);
    header.appendChild(nav);

}