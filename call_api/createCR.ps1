param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Components
)

# ---- Guard: no component names provided ----
if (-not $Components -or $Components.Count -eq 0) {
    Write-Host "No component name provided."
    Write-Host "Usage: ./createCR <componentName> [componentName2 ...]"
    exit 1
}

# Ensure base folders exist
$controllersPath = "controllers"
$routesPath = "routes"

if (-not (Test-Path $controllersPath)) {
    New-Item -ItemType Directory -Path $controllersPath | Out-Null
    Write-Host "Created controllers folder"
}

if (-not (Test-Path $routesPath)) {
    New-Item -ItemType Directory -Path $routesPath | Out-Null
    Write-Host "Created routes folder"
}

foreach ($rawName in $Components) {

    # Validate component name
    if (
        [string]::IsNullOrWhiteSpace($rawName) -or
        -not ($rawName -match '^[a-zA-Z0-9_-]+$')
    ) {
        Write-Host "Skipping invalid component name: '$rawName'"
        continue
    }

    $name = $rawName.ToLower()

    $controllerFile = "$controllersPath\$name`Controller.js"
    $routeFile = "$routesPath\$name`Route.js"

    # Skip if component already exists
    if ((Test-Path $controllerFile) -or (Test-Path $routeFile)) {
        Write-Host "Component '$name' already exists. Skipping."
        continue
    }

    # ---------- Controller ----------
@'
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.doSomething = catchAsync(async (req, res, next) => {
  // Your implementation here
  res.status(200).json({ status: "success", data: {} });
});

exports.doSomethingWithId = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  if (!id) {
    return next(new AppError("ID parameter is missing", 400));
  }

  // Your implementation here
  res.status(200).json({ status: "success", data: { id } });
});
'@ | Set-Content $controllerFile


    # ---------- Route ----------
@"
const express = require("express");
const {
  doSomething,
  doSomethingWithId,
} = require("../controllers/${name}Controller");

const router = express.Router({ mergeParams: true });

router.route("/").get(doSomething);
router.route("/:id").get(doSomethingWithId);

// Usage example:
// const ${name}Route = require("./routes/${name}Route");
// app.use("/api/v1/${name}", ${name}Route);

module.exports = router;
"@ | Set-Content $routeFile


    Write-Host "Component '$name' created successfully"
}
