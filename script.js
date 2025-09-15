
document.addEventListener("DOMContentLoaded", () => {
  feather.replace();
  document.getElementById("reportDate").valueAsDate = new Date();
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    themeToggle.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
  });

  const engineerSigPad = new SignaturePad(document.getElementById("engineerSignature"));
  const customerSigPad = new SignaturePad(document.getElementById("customerSignature"));
  document.getElementById("clearEngineerSig").addEventListener("click", () => engineerSigPad.clear());
  document.getElementById("clearCustomerSig").addEventListener("click", () => customerSigPad.clear());

  function previewPhotos(inputElem, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    if (inputElem.files) {
      Array.from(inputElem.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.className = "photo-preview rounded shadow-sm";
          container.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  document.getElementById("beforePhotos").addEventListener("change", function () {
    previewPhotos(this, "beforePhotoContainer");
  });
  document.getElementById("afterPhotos").addEventListener("change", function () {
    previewPhotos(this, "afterPhotoContainer");
  });

  function createTimeRecordRow(date) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = dayNames[date.getDay()];
    const dateStr = date.toISOString().split("T")[0];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${day}</td>
      <td>${dateStr}</td>
      <td><input type="time" name="depart"></td>
      <td><input type="time" name="arrivedSite"></td>
      <td><input type="time" name="departSite"></td>
      <td><input type="time" name="arriveHome"></td>
      <td><input type="text" name="totalHours" readonly></td>
      <td><input type="number" name="mileage" min="0" step="1"></td>
      <td><input type="text" name="comments"></td>
    `;
    const departInput = tr.querySelector('input[name="depart"]');
    const arriveHomeInput = tr.querySelector('input[name="arriveHome"]');
    const totalHoursInput = tr.querySelector('input[name="totalHours"]');
    function updateTotalHours() {
      const depart = departInput.value;
      const arriveHome = arriveHomeInput.value;
      if (depart && arriveHome) {
        const [departH, departM] = depart.split(":").map(Number);
        const [arriveH, arriveM] = arriveHome.split(":").map(Number);
        let departMinutes = departH * 60 + departM;
        let arriveMinutes = arriveH * 60 + arriveM;
        if (arriveMinutes < departMinutes) arriveMinutes += 24 * 60;
        const diffMinutes = arriveMinutes - departMinutes;
        const hours = diffMinutes / 60;
        totalHoursInput.value = hours.toFixed(2);
      } else {
        totalHoursInput.value = "";
      }
    }
    departInput.addEventListener("change", updateTotalHours);
    arriveHomeInput.addEventListener("change", updateTotalHours);
    return tr;
  }

  const timeTableBody = document.querySelector("#timeTable tbody");
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    timeTableBody.appendChild(createTimeRecordRow(date));
  }

  function validateForm() {
    const requiredFields = ["reportDate", "projectNumber", "customerName"];
    for (const id of requiredFields) {
      const field = document.getElementById(id);
      if (!field.value.trim()) {
        alert(`Please fill in the ${id.replace(/([A-Z])/g, ' $1')}`);
        return false;
      }
    }
    return true;
  }

  function prependLogoToPdf(elementId) {
    const container = document.getElementById(elementId);
    const logoDiv = document.createElement("div");
    logoDiv.className = "logo-header";
    logoDiv.innerHTML = `<img src="assets/Bottle.png" alt="Company Logo" /><h2>Engineer Report</h2>`;
    container.prepend(logoDiv);
  }

  function savePdf(elementId, filename) {
    if (!validateForm()) return;
    document.documentElement.classList.remove("dark");
    prependLogoToPdf(elementId);
    const buttons = document.querySelectorAll("#savePdf, #sendEmail, #clearEngineerSig, #clearCustomerSig");
    buttons.forEach(btn => btn.style.display = "none");
    const engineerCanvas = document.getElementById("engineerSignature");
    const customerCanvas = document.getElementById("customerSignature");
    [engineerCanvas, customerCanvas].forEach(canvas => {
      if (canvas && !canvas.classList.contains("converted")) {
        const img = document.createElement("img");
        img.src = canvas.toDataURL();
        img.className = "photo-preview";
        canvas.parentNode.insertBefore(img, canvas);
        canvas.classList.add("converted");
      }
    });
    const element = document.getElementById(elementId);
    const opt = {
      margin: 0.3,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save().then(() => {
      buttons.forEach(btn => btn.style.display = "");
    });
  }

  document.getElementById("savePdf").addEventListener("click", () => {
    const date = document.getElementById("reportDate").value || new Date().toISOString().split("T")[0];
    savePdf("reportForm", `Engineer_Report_${date}.pdf`);
  });

  document.getElementById("sendEmail").addEventListener("click", () => {
    const date = document.getElementById("reportDate").value;
    const project = document.getElementById("projectNumber").value.trim();
    const reportText = document.getElementById("reportText").value.trim();
    if (!date) {
      alert("Please select a date before sending email.");
      return;
    }
    const subject = encodeURIComponent(`Engineer Report - ${date}`);
    const bodyLines = [
      `Date: ${date}`,
      project ? `Project Number: ${project}` : "",
      "",
      "Report Summary:",
      reportText ? reportText : "(No details provided)",
      "",
      "Please find the attached report PDF."
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  });
});
