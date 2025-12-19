// --- Configuration ---
const maleNames = ["Muhammad", "Ahmed", "Omar", "Ali", "Yusuf", "Ibrahim", "Bilal", "Hamza", "Abdullah", "Mustafa", "Rahim", "Karim", "Hasan", "Hussain", "Zaid"];
const femaleNames = ["Fatima", "Aisha", "Mariam", "Khadija", "Zainab", "Hafsa", "Noor", "Layla", "Sarah", "Sumayya", "Nasreen", "Parveen", "Salma", "Rukhsana"];
const countries = ["Saudi Arabia", "Bangladesh", "Turkey", "Malaysia", "UAE", "Qatar", "UK", "USA", "Oman", "Kuwait", "Indonesia", "Pakistan"];
const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

let currentData = [];
let logoDataUrl = null;

// --- 1. Initialization ---
window.onload = function() {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Correct date format for input (YYYY-MM-DD)
    const formatDate = (d) => d.toISOString().split('T')[0];
    document.getElementById('startDate').value = formatDate(firstDay);
    document.getElementById('endDate').value = formatDate(lastDay);
    
    prepareLogo();
    generateData();
};

// --- 2. Logo Processor (Loads from SVG file) ---
function prepareLogo() {
    const img = document.getElementById('sourceLogo');
    const canvas = document.getElementById('logoCanvas');
    const ctx = canvas.getContext('2d');

    // Canvas size matching the SVG viewBox (1280x1024)
    canvas.width = 1280;
    canvas.height = 1024;

    // Helper to draw image to canvas
    const drawToCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
            logoDataUrl = canvas.toDataURL('image/png');
        } catch (error) {
            console.warn("Cannot convert logo to Data URL. Please run on a local server (e.g., Live Server) to fix PDF logo issue.");
        }
    };

    if (img.complete) {
        drawToCanvas();
    } else {
        img.onload = drawToCanvas;
    }
}

// --- 3. Helper Functions ---
function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

function hideEmail(name) {
    const cleanName = name.replace(/\s/g, '').toLowerCase();
    return `${cleanName.substring(0, 3)}****@${getRandomItem(domains)}`;
}

// --- 4. Main Data Generator ---
function generateData() {
    const tableBody = document.getElementById('tableBody');
    const targetAmount = parseInt(document.getElementById('targetAmount').value) || 0;
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);

    if (targetAmount <= 0) {
        alert("Please enter a valid target amount.");
        return;
    }
    
    tableBody.innerHTML = '';
    currentData = [];

    let currentSum = 0;
    let index = 1;

    // Loop until EXACT sum is reached
    while (currentSum < targetAmount) {
        let remaining = targetAmount - currentSum;
        
        // Random amount logic: mostly small (50-400), sometimes medium
        let amount = Math.floor(Math.random() * 450) + 50; 
        
        // If the random amount is bigger than what's left, just take what's left
        if (amount > remaining) {
            amount = remaining;
        }
        
        // If the remaining amount is very small (e.g. 20 BDT), force finish it
        if (remaining <= 50) {
             amount = remaining; 
        }

        // Data Creation
        const isMale = Math.random() > 0.4;
        const firstName = isMale ? getRandomItem(maleNames) : getRandomItem(femaleNames);
        const lastName = getRandomItem(maleNames); // Use male names as surnames
        const fullName = `${firstName} ${lastName}`;
        const email = hideEmail(fullName);
        const country = getRandomItem(countries);
        const date = getRandomDate(startDate, endDate);

        currentData.push({ index, name: fullName, email, country, date, amount });
        
        currentSum += amount;
        index++;
    }

    // Render HTML Table
    currentData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.index}</td>
            <td>${row.name}</td>
            <td>${row.email}</td>
            <td>${row.country}</td>
            <td>${row.date}</td>
            <td class="amount-cell">${row.amount}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Add Total Row
    const trTotal = document.createElement('tr');
    trTotal.className = 'total-row';
    trTotal.innerHTML = `
        <td colspan="5" style="text-align:right; padding-right:20px;">TOTAL COMPLETED:</td>
        <td>${currentSum} BDT</td>
    `;
    tableBody.appendChild(trTotal);
}

// --- 5. PDF Generation ---
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const masjidName = document.getElementById('masjidName').value;
    const sDate = document.getElementById('startDate').value;
    const eDate = document.getElementById('endDate').value;
    const totalSum = currentData.reduce((sum, item) => sum + item.amount, 0);

    // 1. Add Logo
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', 10, 10, 38, 30); // x, y, w, h
        } catch (e) {
            console.error("Error adding logo to PDF:", e);
        }
    }

    // 2. Add Header Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(5, 170, 28); // Matches logo green
    doc.text("DONATION REPORT", 195, 20, { align: "right" });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(masjidName, 195, 28, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${sDate} to ${eDate}`, 195, 35, { align: "right" });

    // 3. Create Table Data
    const tableColumn = ["#", "Donor Name", "Email", "Country", "Date", "Amount (BDT)"];
    const tableRows = [];

    currentData.forEach(row => {
        const rowData = [
            row.index,
            row.name,
            row.email,
            row.country,
            row.date,
            row.amount
        ];
        tableRows.push(rowData);
    });

    // Add Total Row for PDF
    tableRows.push(["", "", "", "", "TOTAL COMPLETED", `${totalSum} BDT`]);

    // 4. Generate AutoTable
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'striped',
        headStyles: { 
            fillColor: [5, 170, 28], 
            textColor: 255, 
            halign: 'left',
            fontStyle: 'bold'
        },
        bodyStyles: { textColor: 50 },
        alternateRowStyles: { fillColor: [245, 252, 245] },
        // Styling the last row (Total)
        didParseCell: function (data) {
            if (data.row.index === tableRows.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 220, 220];
                data.cell.styles.textColor = [0, 0, 0];
            }
        }
    });

    // 5. Footer
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Report Generated by Visernic Donation System", 105, 285, { align: "center" });
    doc.text("Confidential Document", 105, 290, { align: "center" });
    
    // Save
    doc.save(`${masjidName.replace(/\s/g, '_')}_Report.pdf`);
}