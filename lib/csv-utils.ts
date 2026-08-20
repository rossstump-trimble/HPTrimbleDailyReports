interface AccessData {
  userName: string;
  itemName: string;
  itemType: string;
  fileType?: string;
  accessLevel?: string;
}

export function generateAccessCSV(data: AccessData[]): string {
  // CSV Header
  const headers = [
    "User Name",
    "Item Name",
    "Type",
    "File Type",
    "Access Level",
  ];

  // Convert data to CSV rows
  const rows = data.map((row) => [
    row.userName,
    row.itemName,
    row.itemType,
    row.fileType || "",
    row.accessLevel || "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
