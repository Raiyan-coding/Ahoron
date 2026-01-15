// exchathistory.js - Basic interactivity for Exchange Chat History

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle image lazy loading (for performance with thousands of images)
    function lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Function to toggle section visibility (for better UX with many items)
    function toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        const content = section.querySelector('.section-content');
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Add toggle buttons to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const h2 = section.querySelector('h2');
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Toggle';
        toggleBtn.addEventListener('click', () => toggleSection(section.id));
        h2.appendChild(toggleBtn);
    });

    // Initialize lazy loading
    lazyLoadImages();

    // Example: Add more demo items dynamically (for testing with many items)
    function addMoreDemoItems() {
        const photoGallery = document.querySelector('.photo-gallery');
        for (let i = 5; i <= 10; i++) {
            const img = document.createElement('img');
            img.src = `https://via.placeholder.com/200x200?text=Photo+${i}`;
            img.alt = `Photo ${i}`;
            photoGallery.appendChild(img);
        }
    }

    // Uncomment to add more demo photos on load
    // addMoreDemoItems();
});
