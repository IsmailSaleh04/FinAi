const profileInput = document.getElementById('profileImageInput');
const profilePreview = document.getElementById('profileImagePreview');
const wrapper = document.querySelector('.profile-image-wrapper');

const userId = localStorage.getItem('userId');

// Click image to open file picker
wrapper.addEventListener('click', () => {
  profileInput.click();
});

// When file selected, preview + upload
profileInput.addEventListener('change', async () => {
  const file = profileInput.files[0];
  if (!file) return;

  // Preview the image
  const reader = new FileReader();
  reader.onload = () => {
    profilePreview.src = reader.result;
  };
  reader.readAsDataURL(file);

  // Upload
  const formData = new FormData();
  formData.append('profileImage', file);
  formData.append('userId', userId);

  try {
    const res = await fetch('/api/auth/upload_profile_photo', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log('Uploaded:', data);
    alert('Profile photo updated!');
  } catch (err) {
    console.error('Upload failed:', err);
    alert('Failed to upload image');
  }
});

async function loadUserProfile() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  try {
    const res = await fetch(`/api/auth/user_profile/${userId}`);
    const data = await res.json();

    if (data && data.profile_image) {
      document.getElementById('profileImagePreview').src = data.profile_image;
    }
    if (data && data.name) {
      document.getElementById('userName').textContent = `Welcome, ${data.name[0].toUpperCase() + data.name.slice(1)}`;
    }
  } catch (err) {
    console.error('Failed to load user profile:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadUserProfile);