// Basic Selenium smoke test. Start the app first with `npm start`.
// Set BASE_URL if the app is running at a different address.
const { Builder, By, until } = require("selenium-webdriver");
const assert = require("node:assert/strict");

(async function smokeTest() {
  const driver = await new Builder().forBrowser("chrome").build();
  try {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    await driver.get(baseUrl);
    await driver.wait(until.titleIs("Student Attendance Management"), 10000);
    const heading = await driver.findElement(By.css("h1")).getText();
    assert.equal(heading, "Student Attendance Management");
    await driver.findElement(By.id("roll")).sendKeys("TEST001");
    await driver.findElement(By.id("name")).sendKeys("Test Student");
    await driver.findElement(By.id("department")).sendKeys("CSE");
    await driver.findElement(By.css("#student-form button")).click();
    await driver.wait(until.elementLocated(By.css("#attendance-table tbody tr")), 10000);
    const rowCount = await driver.findElements(By.css("#attendance-table tbody tr"));
    assert.ok(rowCount.length >= 1, "Student should appear in the attendance table");
    console.log("Selenium smoke test passed.");
  } finally {
    await driver.quit();
  }
})().catch(err => { console.error(err); process.exit(1); });
