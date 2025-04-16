// Main script that loads common functionality and provides a router for page-specific scripts
document.addEventListener('DOMContentLoaded', function() {
    // Navigation to generator page
    const generatorButton = document.getElementById("generator");
    if (generatorButton) {
        generatorButton.addEventListener("click", toGenerator);
    }
});