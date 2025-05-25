document.addEventListener("DOMContentLoaded", () => {
    const likeBtn = document.getElementById("likeBtn");
    const likeIcon = document.getElementById("likeIcon");
    const likeCountSpan = document.getElementById("likeCount");

    likeBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const postId = likeBtn.getAttribute("data-post-id");

      try {
        const response = await fetch(`/api/posts/like/${postId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }
        });

        const data = await response.json();

        if (data.success) {
          // Update icon
          likeIcon.textContent = data.liked ? "favorite" : "favorite_border";

          // Update like count
          let currentCount = parseInt(likeCountSpan.textContent);
          likeCountSpan.textContent = data.liked ? currentCount + 1 : currentCount - 1;
        } else {
          alert(data.message || "Failed to toggle like.");
        }
      } catch (err) {
        console.error("AJAX error:", err);
        alert("Something went wrong.");
      }
    });
  });