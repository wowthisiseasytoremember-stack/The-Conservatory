
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

    // 3. Geographic / Distribution Map (broader selectors)
    const mapSelectors = [
        '#flowgrow img[src*="googleusercontent.com"]',
        '#flowgrow img[src*="maps.googleapis.com"]',
        '#flowgrow img[src*="maps.google.com"]',
        '#flowgrow img[src*="flowgrow.de/db/assets/images/usage"]',
        'img[src*="distribution"]',
        'img[alt*="distribution"]',
        'img[alt*="Distribution"]'
    ];
    let distributionMap = '';
    for (const sel of mapSelectors) {
        const img = document.querySelector(sel);
        if (img && img.src) { distributionMap = img.src; break; }
    }

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

    // Extract scientific name from traits table
    const scientificName = traits['Complete botanical name'] || traits['Scientific name'] || traits['Species'] || '';
    
    // Extract key biological metadata
    const genus = traits['Genus'] || (scientificName ? scientificName.split(' ')[0] : '');
    const family = traits['Family'] || '';
    const origin = traits['Origin'] || traits['Distribution'] || traits['Habitat'] || '';

    // Placement heuristics (URL-based, then page-content based)
    if (url.includes('epiphyte')) traits['placement'] = 'epiphyte';
    else if (url.includes('foreground') || url.includes('ground-cover')) traits['placement'] = 'foreground';
    else if (url.includes('middleground')) traits['placement'] = 'midground';
    else if (url.includes('background')) traits['placement'] = 'background';
    else if (url.includes('floating')) traits['placement'] = 'floating';
    else if (url.includes('mosses')) traits['placement'] = 'epiphyte';
    else {
        const html = document.body.innerHTML; 
        if (html.includes('foreground')) traits['placement'] = 'foreground';
        else if (html.includes('middleground')) traits['placement'] = 'midground';
        else if (html.includes('background')) traits['placement'] = 'background';
        else if (html.includes('floating')) traits['placement'] = 'floating';
        else if (html.includes('epiphyte')) traits['placement'] = 'epiphyte';
    }
    
    const difficultyText = traits['Difficulty'] ? traits['Difficulty'].toLowerCase() : '';
    if (document.querySelector('.difficulty-easy') || difficultyText.includes('easy')) traits['difficulty'] = 'easy';
    if (document.querySelector('.difficulty-medium') || difficultyText.includes('medium')) traits['difficulty'] = 'medium';
    if (document.querySelector('.difficulty-hard') || difficultyText.includes('hard')) traits['difficulty'] = 'hard';

    // Ensure Genus and Family are in traits
    if (genus) traits['Genus'] = genus;
    if (family) traits['Family'] = family;
    if (origin) traits['Origin'] = origin;
    
    // 5. Images
    const images = [];
    document.querySelectorAll('.product-detail-image img, #image-main img').forEach(img => {
        if (img.src && !images.includes(img.src)) images.push(img.src);
    });

    return {
        id: url.split('/').pop() || 'unknown',
        name: name,
        scientificName: scientificName,
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
