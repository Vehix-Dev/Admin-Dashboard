# Apply Colorful Card Borders Script
# Adds vibrant left borders to dashboard cards

$files = @(
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\reports\users\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\reports\services\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\reports\page.tsx"
)

$colors = @('orange', 'navy', 'emerald', 'amber')
$colorIndex = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Encoding UTF8 | Out-String
        
        # Add colorful borders to stat cards (first 4 mantis-cards in each file)
        $count = 0
        $pattern = 'className="mantis-card p-6"'
        
        while ($content -match $pattern -and $count -lt 4) {
            $color = $colors[$count % 4]
            $content = $content -replace $pattern, "className=`"mantis-card-$color p-6`"", 1
            $count++
        }
        
        Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✓ Updated: $file ($count cards)"
    }
}

Write-Host "`nColorful borders applied!"
