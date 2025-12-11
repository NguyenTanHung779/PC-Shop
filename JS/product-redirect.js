// product-redirect.js
// When a product tile/link has a `data-item-id` attribute, navigate to the dynamic product page
document.addEventListener('click', function(e){
  const a = e.target.closest('a');
  if (!a) return;

  // prefer explicit data-item-id
  const dataId = a.dataset && a.dataset.itemId;
  if (dataId) {
    e.preventDefault();
    window.location.href = `products/product.html?id=${encodeURIComponent(dataId)}`;
    return;
  }

  // if the anchor has class product-link but no data-id, leave default behavior
  // (you can add data-item-id attributes to product links in home/shop pages)
});
