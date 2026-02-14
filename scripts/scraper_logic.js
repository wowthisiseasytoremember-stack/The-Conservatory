
function scrapeProduct(url) {
    function text(sel) { 
        return document.querySelector(sel)?.textContent?.trim() || ''; 
    }
    function allText(sel) { 
        return Array.from(document.querySelectorAll(sel)).map(el => el.textContent?.trim()).join('\n\n'); 
    }

    // 1. Basic Info
    const name = text('h1');
    
    // 2. Rich Text & Narrative
    const descriptionEl = document.querySelector('#description-1');
    const narrativeHtml = descriptionEl ? descriptionEl.innerHTML.trim() : '';
    const description = descriptionEl ? descriptionEl.innerText.trim() : '';
    
    const flowgrowEl = document.querySelector('#flowgrow');
    const notes = flowgrowEl ? flowgrowEl.innerText.trim() : '';
    const general = text('#general p');

    // 3. Geographic / Distribution Map
    // Look for map images - they often have maps.google.com or similar in src
    const mapImg = document.querySelector('#flowgrow img[src*="googleusercontent.com"], #flowgrow img[src*="maps.googleapis.com"], #flowgrow img[src*="maps.google.com"]');
    const distributionMap = mapImg ? mapImg.src : '';

    // 4. Traits
    const traits = {};
    
    // Aquasabi / flowgrow tables
    const tableRows = document.querySelectorAll('#large-flowgrow-table tr, #small-flowgrow-table tr, #view-group-culture tr, table.table tr');
    tableRows.forEach(row => {
       const keyEl = row.querySelector('th, td.bold, td:first-child');
       const valEl = row.querySelector('td:not(.bold):not(:first-child), td:last-child');
       if (keyEl && valEl) {
           const key = keyEl.textContent.trim().replace(/:$/, '');
           const val = valEl.textContent.trim();
           if (key && val && key.length < 50) traits[key] = val;
       }
    });
    
    // ... (rest of the heuristics)
    const html = document.body.innerHTML; 
    if (html.includes('foreground')) traits['placement'] = 'foreground';
    else if (html.includes('middleground')) traits['placement'] = 'midground';
    else if (html.includes('background')) traits['placement'] = 'background';
    else if (html.includes('floating')) traits['placement'] = 'floating';
    else if (html.includes('epiphyte')) traits['placement'] = 'epiphyte';
    
    const difficultyText = traits['Difficulty'] ? traits['Difficulty'].toLowerCase() : '';
    if (document.querySelector('.difficulty-easy') || difficultyText.includes('easy')) traits['difficulty'] = 'easy';
    if (document.querySelector('.difficulty-medium') || difficultyText.includes('medium')) traits['difficulty'] = 'medium';
    if (document.querySelector('.difficulty-hard') || difficultyText.includes('hard')) traits['difficulty'] = 'hard';
    
    // 5. Images
    const images = [];
    document.querySelectorAll('.product-detail-image img, #image-main img').forEach(img => {
        if (img.src && !images.includes(img.src)) images.push(img.src);
    });

    return {
        id: url.split('/').pop() || 'unknown',
        name: name,
        url: url,
        images: [], 
        rawImages: images, 
        details: { 
            description: description, 
            notes: notes, 
            maintenance: general,
            narrativeHtml: narrativeHtml,
            distributionMap: distributionMap
        },
        traits: traits,
        listingType: 'aquasabi'
    };
}
