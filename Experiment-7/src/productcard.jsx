import React from "react";

function ProductCard({ name, price, status }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "20px",
        margin: "10px",
        width: "200px",
        textAlign: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
      }}
    >
      <h3 style={{ fontWeight: "bold" }}>{name}</h3>
      <p>Price: ${price}</p>
      <p>Status: {status}</p>
    </div>
  );
}

function ProductsList() {
  const products = [
    { name: "Wireless Mouse", price: 25.99, status: "In Stock" },
    { name: "Keyboard", price: 45.5, status: "Out of Stock" },
    { name: "Monitor", price: 199.99, status: "In Stock" },
  ];

  return (
    <div
      style={{
        border: "1px solid black",
        padding: "20px",
        margin: "20px",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontWeight: "bold" }}>Products List</h2>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        {products.map((product, index) => (
          <ProductCard
            key={index}
            name={product.name}
            price={product.price}
            status={product.status}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductsList;