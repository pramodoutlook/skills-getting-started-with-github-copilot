document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Add HTML-escaping helper to avoid injecting raw content
  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and existing options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHTML = '<div class="participants-section">';
        participantsHTML += '<div class="participants-title">Participants</div>';

        if (details.participants && details.participants.length > 0) {
          participantsHTML += '<div class="participants-list"><ul>';
          participantsHTML += details.participants
            .map(
              (p) =>
                `<li><span class="participant-badge">${escapeHTML(p)}</span><button class="delete-participant" data-activity="${encodeURIComponent(
                  name
                )}" data-email="${encodeURIComponent(p)}" aria-label="Remove participant">✖</button></li>`
            )
            .join("");
          participantsHTML += "</ul></div>";
        } else {
          participantsHTML += '<div class="no-participants">No participants yet.</div>';
        }

        participantsHTML += "</div>";

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the UI shows the newly added participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click handler for delete buttons on participant items
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-participant");
    if (!btn) return;

    const encodedActivity = btn.getAttribute("data-activity");
    const encodedEmail = btn.getAttribute("data-email");

    if (!encodedActivity || !encodedEmail) return;

    const activity = decodeURIComponent(encodedActivity);
    const email = decodeURIComponent(encodedEmail);

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await res.json();

      if (res.ok) {
        // Refresh activities so availability and participant lists update
        await fetchActivities();

        messageDiv.textContent = result.message || "Participant removed";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      messageDiv.textContent = "Failed to remove participant.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  fetchActivities();
});
