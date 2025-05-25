document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems);
  });

document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);

    const form = document.getElementById('uploadForm');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const formData = new FormData(form);
  
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
  
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Upload failed');
        }
  
        const data = await res.json();
  
        if (data.success) {
          // Show success modal
          const successModal = M.Modal.getInstance(document.getElementById('success-modal'));
          successModal.open();
          form.reset();
        } else {
          // Show error modal
          const errorModal = M.Modal.getInstance(document.getElementById('error-modal'));
          errorModal.open();
        }
      } catch (err) {
        console.error('Error:', err);
        // Show error modal
        const errorModal = M.Modal.getInstance(document.getElementById('error-modal'));
        errorModal.open();
      }
    });
});

  
  