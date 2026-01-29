# Mantis Design Batch Update Script
# This PowerShell script applies Mantis design patterns to all admin pages

$files = @(
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\reports\users\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\reports\services\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\reports\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\requests\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\riders\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\roadies\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\wallet\page.tsx",
    "c:\Users\tutum\Downloads\vehix-admin-crm(3)\app\admin\services\page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Replace card styling
        $content = $content -replace 'bg-card border border-border rounded-xl p-6 shadow-sm', 'mantis-card p-6'
        
        # Replace solid icon backgrounds with soft ones
        $content = $content -replace 'bg-blue-500 text-white', 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
        $content = $content -replace 'bg-green-500 text-white', 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
        $content = $content -replace 'bg-emerald-500 text-white', 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
        $content = $content -replace 'bg-amber-500 text-white', 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        $content = $content -replace 'bg-purple-500 text-white', 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
        $content = $content -replace 'bg-red-500 text-white', 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
        
        # Update chart colors to Vehix palette
        $content = $content -replace '#3B82F6', '#F05A28'  # Blue to Orange
        $content = $content -replace '#3b82f6', '#F05A28'  # Blue to Orange (lowercase)
        
        Set-Content $file $content -NoNewline
        Write-Host "Updated: $file"
    }
}

Write-Host "Batch update complete!"
