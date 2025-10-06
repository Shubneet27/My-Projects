const dropdown = document.getElementById("category1");
const products = document.querySelectorAll("#products1 .product");

dropdown.addEventListener("change", function () {
  const category = this.value;
  products.forEach(p => {
    p.style.display = (category === "all" || p.dataset.category === category) ? "block" : "none";
  });
});