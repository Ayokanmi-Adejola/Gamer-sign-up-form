const form = document.querySelector("#signup-form");
const fields = {
  callsign: document.querySelector("#callsign"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  confirm: document.querySelector("#confirm"),
  terms: document.querySelector("#terms"),
};
const labels = { callsign: "callsign", email: "email", password: "password", confirm: "confirm", terms: "terms" };
const checked = new Set();
const status = document.querySelector("#submit-status");
const submitButton = document.querySelector(".submit-button");
const readyCount = document.querySelector("#ready-count");
const operatorState = document.querySelector("#operator-state");

function messageFor(name) {
  const value = name === "terms" ? fields.terms.checked : fields[name].value.trim();
  if (!value) return name === "terms" ? "Accept the terms to continue" : "Required";
  if (name === "callsign") {
    if (value.length < 3) return "Use at least 3 characters";
    if (value.length > 20) return "Use 20 characters or fewer";
    if (!/^[A-Za-z0-9_-]+$/.test(value)) return "Use letters, numbers, _ or - only";
  }
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email, like you@example.com";
  if (name === "password" && value.length < 8) return "Use at least 8 characters";
  if (name === "confirm" && value !== fields.password.value) return "Passwords don't match";
  return "";
}

function validate(name, showEmpty = false) {
  const field = document.querySelector(`[data-field="${name}"]`) || document.querySelector(".terms-field");
  const error = document.querySelector(`#${name}-error`);
  const message = messageFor(name);
  const shouldShow = checked.has(name) || showEmpty || message === "Passwords don't match";
  field.classList.toggle("invalid", Boolean(message) && shouldShow);
  field.classList.toggle("valid", !message && (checked.has(name) || showEmpty));
  error.textContent = shouldShow ? message : "";
  const indicator = document.querySelector(`#status-${name}`);
  if (indicator) indicator.textContent = message ? (shouldShow ? "Locked" : name === "terms" ? "Required" : "Pending") : "OK";
  return !message;
}

function updateReadout() {
  const valid = Object.keys(fields).filter((name) => validate(name)).length;
  readyCount.textContent = `${valid}/5`;
  operatorState.textContent = messageFor("callsign") ? "Unassigned" : fields.callsign.value.trim();
}

function updateStrength() {
  const value = fields.password.value;
  const strength = document.querySelector(".strength");
  const label = document.querySelector("#strength-label");
  if (!value) { strength.removeAttribute("data-score"); label.textContent = ""; return; }
  let score = value.length >= 8 ? 1 : 0;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  score = Math.min(score, 4);
  strength.dataset.score = score;
  label.textContent = ["", "Weak", "Fair", "Good", "Strong"][score];
}

Object.entries(fields).forEach(([name, input]) => {
  input.addEventListener("blur", () => { checked.add(name); validate(name); updateReadout(); });
  input.addEventListener("input", () => {
    if (checked.has(name)) validate(name);
    if (name === "password") { updateStrength(); if (checked.has("confirm")) validate("confirm"); }
    updateReadout();
  });
});
document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = fields[button.dataset.target];
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    button.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    button.querySelector("img").src = `./assets/images/icon-eye${visible ? "" : "-off"}.svg`;
  });
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  Object.keys(fields).forEach((name) => checked.add(name));
  const invalid = Object.keys(fields).filter((name) => !validate(name, true));
  updateReadout();
  if (invalid.length) {
    status.textContent = `${invalid.length} field${invalid.length === 1 ? "" : "s"} need attention`;
    fields[invalid[0]].focus();
    return;
  }
  status.textContent = "";
  document.querySelectorAll(".toggle-password").forEach((button) => {
    const input = fields[button.dataset.target];
    input.type = "password";
    button.querySelector("img").src = "./assets/images/icon-eye.svg";
  });
  Object.values(fields).forEach((input) => { input.disabled = true; });
  submitButton.disabled = true;
  submitButton.textContent = "Transmitting_";
  setTimeout(() => {
    document.querySelector("#success-callsign").textContent = fields.callsign.value.trim();
    document.querySelector("#form-view").hidden = true;
    document.querySelector("#success-view").hidden = false;
    document.querySelector("#success-view h2").focus();
  }, 1100);
});
fields.terms.addEventListener("change", () => { checked.add("terms"); validate("terms"); updateReadout(); });
updateStrength();
