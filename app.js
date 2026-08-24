// ================================
// NATI BUNKER — LA MATRIZ
// ================================

// Mostrar / ocultar dinero disponible
let balanceVisible = true;

function toggleBalance() {
  const balance = document.getElementById("balance");
  const eye = document.getElementById("eyeButton");

  if (!balance || !eye) return;

  if (balanceVisible) {
    balance.textContent = "••••••";
    eye.textContent = "🙈";
    balanceVisible = false;
  } else {
    balance.textContent = "$ 1.234.567";
    eye.textContent = "👁";
    balanceVisible = true;
  }
}
