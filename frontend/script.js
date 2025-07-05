// Global variables
let startTime = null

// Mobile menu toggle
function toggleMenu() {
  const navMenu = document.querySelector(".nav-menu")
  const hamburger = document.querySelector(".hamburger")

  navMenu.classList.toggle("active")
  hamburger.classList.toggle("active")
}

// Close mobile menu when clicking on links
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-menu a")
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const navMenu = document.querySelector(".nav-menu")
      const hamburger = document.querySelector(".hamburger")
      navMenu.classList.remove("active")
      hamburger.classList.remove("active")
    })
  })

  if (document.getElementById("newsInput")) {
    initializeSummarizer()
  }
})

// Count words function
function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

// Update word count
function updateWordCount() {
  const input = document.getElementById("newsInput")
  const wordCountElement = document.getElementById("wordCount")
  const originalWordsElement = document.getElementById("originalWords")

  if (input && wordCountElement) {
    const count = countWords(input.value)
    wordCountElement.textContent = count
    if (originalWordsElement) {
      originalWordsElement.textContent = count
    }
  }
}

// Show/hide elements
function showElement(element) {
  element.style.display = "block"
}

function hideElement(element) {
  element.style.display = "none"
}

// Show messages
function showMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = message
    showElement(element)
    setTimeout(() => hideElement(element), isError ? 5000 : 3000)
  }
}

// Show loading state
function showLoading() {
  const btn = document.getElementById("summarizeBtn")
  const btnText = btn.querySelector(".btn-text")
  const btnLoading = btn.querySelector(".btn-loading")

  btn.disabled = true
  hideElement(btnText)
  showElement(btnLoading)

  const output = document.getElementById("summaryOutput")
  output.innerHTML = "<p><em>Generating summary...</em></p>"
}

// Hide loading state
function hideLoading() {
  const btn = document.getElementById("summarizeBtn")
  const btnText = btn.querySelector(".btn-text")
  const btnLoading = btn.querySelector(".btn-loading")

  btn.disabled = false
  showElement(btnText)
  hideElement(btnLoading)
}

// Clear input
function clearInput() {
  const input = document.getElementById("newsInput")
  const output = document.getElementById("summaryOutput")
  const copyBtn = document.getElementById("copyBtn")

  input.value = ""
  updateWordCount()
  output.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📄</div>
      <h3>Your summary will appear here</h3>
      <p>Enter an article and click "Summarize Article" to get started</p>
    </div>`
  hideElement(copyBtn)
  resetStats()
}

// Load sample text
function loadSample() {
  const input = document.getElementById("newsInput")
  const sampleText = `Breaking News: Scientists Develop Revolutionary Battery Technology

Scientists at MIT have announced a major breakthrough in battery technology...`

  input.value = sampleText
  updateWordCount()
}

// Copy summary to clipboard
async function copySummary() {
  const output = document.getElementById("summaryOutput")
  const copyBtn = document.getElementById("copyBtn")

  try {
    await navigator.clipboard.writeText(output.innerText)
    const originalText = copyBtn.textContent
    copyBtn.textContent = "Copied!"
    setTimeout(() => {
      copyBtn.textContent = originalText
    }, 2000)
    showMessage("successMessage", "Summary copied to clipboard! 📋")
  } catch (error) {
    showMessage("errorMessage", "Failed to copy. Please select and copy manually.", true)
  }
}

// Update statistics
function updateStats(originalText, summaryText) {
  const originalCount = countWords(originalText)
  const summaryCount = countWords(summaryText)
  const compression = originalCount > 0 ? Math.round((1 - summaryCount / originalCount) * 100) : 0
  const processingTime = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : 0

  document.getElementById("originalWords").textContent = originalCount
  document.getElementById("summaryWords").textContent = summaryCount
  document.getElementById("compressionRatio").textContent = compression + "%"
  document.getElementById("processingTime").textContent = processingTime + "s"
}

// Reset statistics
function resetStats() {
  document.getElementById("summaryWords").textContent = "0"
  document.getElementById("compressionRatio").textContent = "0%"
  document.getElementById("processingTime").textContent = "0s"
}

// Main summarize function
async function summarizeText() {
  const input = document.getElementById("newsInput")
  const output = document.getElementById("summaryOutput")
  const copyBtn = document.getElementById("copyBtn")
  const inputText = input.value.trim()

  if (!inputText) {
    showMessage("errorMessage", "Please enter some text to summarize.", true)
    return
  }

  if (inputText.length < 50) {
    showMessage("errorMessage", "Please enter at least 50 characters for meaningful summarization.", true)
    return
  }

  startTime = Date.now()
  showLoading()

  try {
    const response = await fetch("http://localhost:5000/summarise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: inputText }),
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    const data = await response.json()

    if (data.error || !data.summary) {
      throw new Error(data.error || "Empty summary returned from server.")
    }

    output.textContent = data.summary
    showElement(copyBtn)
    updateStats(inputText, data.summary)
    showMessage("successMessage", "Article summarized successfully! 🎉")
  } catch (error) {
    console.error("Error:", error)
    let errorMessage = "An error occurred. Please try again."
    if (error.message.includes("fetch")) {
      errorMessage = "Cannot connect to server. Make sure the backend is online."
    } else if (error.message.includes("Server error")) {
      errorMessage = "Server error. Please check your backend server."
    } else if (error.message) {
      errorMessage = error.message
    }

    showMessage("errorMessage", errorMessage, true)

    output.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <h3>Your summary will appear here</h3>
        <p>Enter an article and click "Summarize Article" to get started</p>
      </div>`
    hideElement(copyBtn)
  } finally {
    hideLoading()
  }
}

// Initialize summarizer
function initializeSummarizer() {
  const input = document.getElementById("newsInput")
  const clearBtn = document.getElementById("clearBtn")
  const sampleBtn = document.getElementById("sampleBtn")
  const summarizeBtn = document.getElementById("summarizeBtn")
  const copyBtn = document.getElementById("copyBtn")

  if (input) {
    input.addEventListener("input", updateWordCount)
    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault()
        summarizeText()
      }
    })
  }

  if (clearBtn) clearBtn.addEventListener("click", clearInput)
  if (sampleBtn) sampleBtn.addEventListener("click", loadSample)
  if (summarizeBtn) summarizeBtn.addEventListener("click", summarizeText)
  if (copyBtn) copyBtn.addEventListener("click", copySummary)

  updateWordCount()
}

// Smooth scroll for anchor links
document.addEventListener("click", (e) => {
  if (e.target.tagName === "A" && e.target.getAttribute("href").startsWith("#")) {
    e.preventDefault()
    const targetId = e.target.getAttribute("href").substring(1)
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" })
    }
  }
})