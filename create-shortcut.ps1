$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('C:\Users\mehek\OneDrive\Desktop\ILMS Laboratory System.lnk')
$sc.TargetPath = 'msedge.exe'
$sc.Arguments = '--app=http://localhost:5173'
$sc.Description = 'ILMS — Intelligent Multi-Laboratory Management'
$sc.Save()
Write-Host 'Created ILMS Laboratory System.lnk successfully'
