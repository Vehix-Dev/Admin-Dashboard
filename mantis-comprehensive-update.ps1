# Comprehensive Mantis Design Update Script
# Updates all remaining admin pages with Mantis design patterns

$rootPath = "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin"

# Get all page.tsx files recursively
$files = Get-ChildItem -Path $rootPath -Filter "page.tsx" -Recurse | Select-Object -ExpandProperty FullName

$updatedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file -Encoding UTF8 | Out-String
    $originalContent = $content
    
    # Replace card styling patterns
    $content = $content -replace 'className="bg-card border border-border rounded-xl p-6 shadow-sm"', 'className="mantis-card p-6"'
    $content = $content -replace 'className="bg-card border border-border rounded-xl p-6"', 'className="mantis-card p-6"'
    $content = $content -replace 'className="bg-card border border-border rounded-xl shadow-sm p-6"', 'className="mantis-card p-6"'
    
    # Replace solid icon backgrounds with soft ones (with proper dark mode support)
    $content = $content -replace 'bg-blue-500 text-white p-3 rounded-lg', 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 p-3 rounded-xl'
    $content = $content -replace 'bg-emerald-500 text-white p-3 rounded-lg', 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 p-3 rounded-xl'
    $content = $content -replace 'bg-green-500 text-white p-3 rounded-lg', 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 p-3 rounded-xl'
    $content = $content -replace 'bg-amber-500 text-white p-3 rounded-lg', 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 p-3 rounded-xl'
    $content = $content -replace 'bg-purple-500 text-white p-3 rounded-lg', 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 p-3 rounded-xl'
    $content = $content -replace 'bg-red-500 text-white p-3 rounded-lg', 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl'
    
    # Update status badge backgrounds
    $content = $content -replace 'bg-green-100 text-green-800', 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
    $content = $content -replace 'bg-blue-100 text-blue-800', 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
    $content = $content -replace 'bg-yellow-100 text-yellow-800', 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
    $content = $content -replace 'bg-red-100 text-red-800', 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
    
    # Update chart colors to Vehix Orange
    $content = $content -replace "stroke=`"#3B82F6`"", "stroke=`"#F05A28`""
    $content = $content -replace "stroke=`"#3b82f6`"", "stroke=`"#F05A28`""
    $content = $content -replace "fill=`"#3B82F6`"", "fill=`"#F05A28`""
    $content = $content -replace "fill=`"#3b82f6`"", "fill=`"#F05A28`""
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
        $relativePath = $file.Replace("c:\Users\tutum\Downloads\vehix-admin-crm(3)\", "")
        Write-Host "✓ Updated: $relativePath"
        $updatedCount++
    }
}

Write-Host "`n========================================="
Write-Host "Batch update complete!"
Write-Host "Total files updated: $updatedCount"
Write-Host "========================================="
