// tableRenderer.js

export function renderTable(containerId, columns, data) {
  const container = document.getElementById(containerId);
  if (!data || data.length === 0) {
    container.innerHTML = `<p class="text-muted text-center">No data found</p>`;
    return;
  }

  let thead = "<tr>";
  columns.forEach(col => {
    thead += `<th>${col.label}</th>`;
  });
  thead += "</tr>";

  let tbody = "";
  data.forEach(row => {
    tbody += "<tr>";

    columns.forEach(col => {
      let content = row[col.key];

      if (col.type === "image") {
        content = content
          ? `<img src="${content}" class="table-img">`
          : `<span class="text-muted">No Image</span>`;
      }

      if (col.type === "badge") {
        content = `<span class="badge bg-${col.color?.(row) || "secondary"}">${content}</span>`;
      }

      if (col.type === "actions") {
        content = col.actions(row);
      }

      tbody += `<td>${content}</td>`;
    });

    tbody += "</tr>";
  });

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-light">${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;
}
