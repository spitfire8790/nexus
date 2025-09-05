#!/usr/bin/env pwsh
# Claude Code wrapper for Windows PowerShell
# Usage: .\claude-code.ps1 [arguments]

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

# Convert arguments to a single string
$argString = if ($Arguments) { $Arguments -join ' ' } else { '' }

# Run Claude Code directly on Windows
node "$(npm root -g)\@anthropic-ai\claude-code\cli.js" $argString 