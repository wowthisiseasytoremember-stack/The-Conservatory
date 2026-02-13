
function scrapeProduct(url) {
    function text(sel) { 
        return document.querySelector(sel)?.textContent?.trim() || ''; 
    }
    function allText(sel) { 
        return Array.from(document.querySelectorAll(sel)).map(el => el.textContent?.trim()).join('\n\n'); 
    }

    // 1. Basic Info
    const name = text('h1');
    
    // 2. Rich Text 
    const description = text('#description-1 p');
    const notes = text('#flowgrow p') || allText('#flowgrow p');
    const general = text('#general p');

    // 3. Traits
    const traits = {};
    
    // Aquasabi / flowgrow tables
    const tableRows = document.querySelectorAll('#large-flowgrow-table tr, #small-flowgrow-table tr, #view-group-culture tr');
    tableRows.forEach(row => {
       const keyEl = row.querySelector('th, td.bold');
       const valEl = row.querySelector('td:not(.bold), td:not(:first-child)');
       if (keyEl && valEl) {
           const key = keyEl.textContent.trim();
           const val = valEl.textContent.trim();
           if (key && val) traits[key] = val;
       }
    });
    
    // General rows
    const generalRows = document.querySelectorAll('#view-group-general .row');
    generalRows.forEach(row => {
        const keyEl = row.querySelector('.label');
        const valEl = row.querySelector('.value');
        if (keyEl && valEl) {
            const key = keyEl.textContent.trim();
            const val = valEl.textContent.trim();
            if (key && val) traits[key] = val;
        }
    });

    // 4. Icons / Heuristics
    const html = document.body.innerHTML; 
    if (html.includes('foreground')) traits['placement'] = 'foreground';
    else if (html.includes('middleground')) traits['placement'] = 'midground';
    else if (html.includes('background')) traits['placement'] = 'background';
    else if (html.includes('floating')) traits['placement'] = 'floating';
    else if (html.includes('epiphyte')) traits['placement'] = 'epiphyte';
    
    // Check for difficulty classes or text
    const difficultyText = traits['Difficulty'] ? traits['Difficulty'].toLowerCase() : '';
    if (document.querySelector('.difficulty-easy') || difficultyText.includes('easy')) traits['difficulty'] = 'easy';
    if (document.querySelector('.difficulty-medium') || difficultyText.includes('medium')) traits['difficulty'] = 'medium';
    if (document.querySelector('.difficulty-hard') || difficultyText.includes('hard')) traits['difficulty'] = 'hard';
    if (document.querySelector('.difficulty-very_hard') || difficultyText.includes('very')) traits['difficulty'] = 'very_hard';
    
    // 5. Images
    const images = [];
    document.querySelectorAll('.product-detail-image img, #image-main img').forEach(img => {
        if (img.src) images.push(img.src);
    });

    return {
        id: url.split('/').pop() || 'unknown',
        name: name,
        url: url,
        images: [], 
        rawImages: images, 
        details: { description: description, notes: notes, maintenance: general },
        traits: traits,
        listingType: 'aquasabi'
    };
}
