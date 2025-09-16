
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

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function createTimeRecordRow(date) {
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
        const [dh, dm] = depart.split(":").map(Number);
        const [ah, am] = arriveHome.split(":").map(Number);
        let departMin = dh * 60 + dm;
        let arriveMin = ah * 60 + am;
        if (arriveMin < departMin) arriveMin += 24 * 60;
        const diff = arriveMin - departMin;
        totalHoursInput.value = (diff / 60).toFixed(2);
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

  function prependLogoToPdf(elementId) {
    const container = document.getElementById(elementId);
    const logoDiv = document.createElement("div");
    logoDiv.innerHTML = '<img src="assets/Bottle.png" alt="Company Logo" style="height:50px;margin-bottom:1rem;" />';
    container.prepend(logoDiv);
  }

  function savePdf(elementId, filename) {
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
        img.style = "max-height:100px;margin-top:10px;";
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
