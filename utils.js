function updateResponseCountBadge() {
    const user = authSystem.getCurrentUser();
    const allResponses = JSON.parse(localStorage.getItem('form-responses') || '[]');
    const userResponses = allResponses.filter(response => 
        response.userId === user.id
    );
    
    const badge = document.getElementById('responseCountBadge');
    if (userResponses.length > 0) {
        badge.textContent = userResponses.length;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

function generateShareableLink(formId) {
    const link = window.location.origin + window.location.pathname + '?formId=' + formId;
    document.getElementById('generatedLink').value = link;
    document.getElementById('shareLinkContainer').classList.remove('d-none');
    initShareButtons(link);
}

function initShareButtons(link) {
    const title = document.getElementById('formTitle').value || 'Feedback Form';
    const text = document.getElementById('formDescription').value || 'Please fill out this form';
    
    // Email share
    document.getElementById('emailShareBtn').addEventListener('click', function() {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + link)}`;
    });
    
    // WhatsApp share
    document.getElementById('whatsappShareBtn').addEventListener('click', function() {
        window.open(`https://wa.me/?text=${encodeURIComponent(title + '\n' + text + '\n' + link)}`, '_blank');
    });
    
    // QR Code Download
    document.getElementById('downloadQrBtn').addEventListener('click', function() {
        const qr = qrcode(0, 'L');
        qr.addData(link);
        qr.make();
        
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Draw QR code
        const moduleCount = qr.getModuleCount();
        const tileSize = size / moduleCount;
        
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                }
            }
        }
        
        // Download the QR code
        const downloadLink = document.createElement('a');
        downloadLink.download = 'feedback-form-qr.png';
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.click();
    });
    
    // Native share API
    if (navigator.share) {
        document.getElementById('nativeShareBtn').classList.remove('d-none');
        document.getElementById('nativeShareBtn').addEventListener('click', async function() {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: link
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        });
    }
    
    // Copy link button
    document.getElementById('copyLinkBtn').addEventListener('click', function() {
        const copyText = document.getElementById('generatedLink');
        copyText.select();
        document.execCommand('copy');
        
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="bi bi-check"></i> Copied!';
        setTimeout(() => {
            this.innerHTML = originalText;
        }, 2000);
    });
}