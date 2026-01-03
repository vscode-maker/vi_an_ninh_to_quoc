
try {
    # 1. Append to README
    "# vi_an_ninh_to_quoc" | Out-File -FilePath "README.md" -Append -Encoding utf8
    Write-Host "Updated README.md"

    # 2. Add all files
    git add .
    Write-Host "Staged all files"

    # 3. Commit
    git commit -m "first commit"
    Write-Host "Committed changes"

    # 4. Rename branch
    git branch -M main
    Write-Host "Renamed branch to main"

    # 5. Add remote (check if exists first to avoid error)
    $remotes = git remote
    if ($remotes -contains "origin") {
        Write-Host "Remote origin already exists. Skipping."
    } else {
        git remote add origin https://github.com/vscode-maker/vi_an_ninh_to_quoc.git
        Write-Host "Added remote origin"
    }
} catch {
    Write-Host "An error occurred: $_"
}
