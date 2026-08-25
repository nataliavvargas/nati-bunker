// ================================
// NATI BUNKER — LA MATRIZ
// ================================

document.addEventListener("DOMContentLoaded", function () {

  const menuButton = document.getElementById("menuButton");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenu = document.getElementById("closeMenu");

  if (menuButton && sideMenu) {

    menuButton.addEventListener("click", function () {
      sideMenu.classList.add("open");
    });

  }

  if (closeMenu && sideMenu) {

    closeMenu.addEventListener("click", function () {
      sideMenu.classList.remove("open");
    });

  }

});
