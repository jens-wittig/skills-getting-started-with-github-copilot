document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and activity select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsList = details.participants.length > 0
          ? details.participants.map(p => `
              <li class="participant-item">
                <span class="participant-email">${p}</span>
                <button class="delete-participant" data-email="${p}" title="Remove ${p}">✖</button>
              </li>`).join('')
          : '<li style="color: #999; font-style: italic;">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // delete handler is registered once outside fetchActivities to avoid duplicates
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
        // Refresh activities immediately so UI reflects new participant
        fetchActivities();
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

  // Initialize app
  fetchActivities();

  // Delegate delete clicks for participant removal (registered once)
  activitiesList.addEventListener('click', async (e) => {
    if (!e.target.matches('.delete-participant')) return;
    const btn = e.target;
    const email = btn.dataset.email;
    const card = btn.closest('.activity-card');
    const activityName = card && card.dataset.activity;

    if (!activityName || !email) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      const result = await resp.json();

      if (resp.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'success';
        // Refresh list to update availability and participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to remove participant';
        messageDiv.className = 'error';
      }

      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    } catch (err) {
      messageDiv.textContent = 'Network error while removing participant';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
    }
  });
});
