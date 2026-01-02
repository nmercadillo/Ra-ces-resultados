// Common utilities

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function parseCSVLine(line) {
    // Regex to handle quoted fields containing commas
    const regex = /,(?=(?:(?:[^"]*\"){2})*[^"]*$)/; 
    return line.split(regex).map(field => field.trim().replace(/^"|"$/g, ''));
}

function parseCSV(text) {
    // Robust CSV parser handling newlines in quotes
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentLine.push(currentField);
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentField || currentLine.length > 0) {
                currentLine.push(currentField);
                lines.push(currentLine);
                currentLine = [];
                currentField = '';
            }
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
        } else {
            currentField += char;
        }
    }

    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
    }

    return lines;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('active');
    } else {
        alert(message);
    }
}

function setupDragAndDrop(uploadSectionId, fileInputId, processFileCallback) {
    const uploadSection = document.getElementById(uploadSectionId);
    const fileInput = document.getElementById(fileInputId);

    if (!uploadSection || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadSection.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadSection.addEventListener(eventName, () => uploadSection.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadSection.addEventListener(eventName, () => uploadSection.classList.remove('dragover'), false);
    });

    uploadSection.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files, processFileCallback);
    }, false);

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files, processFileCallback);
    }, false);
}

function handleFiles(files, processFileCallback) {
    const file = files[0];
    if (file) {
        if (file.name.toLowerCase().endsWith('.csv')) {
            const fileInfo = document.getElementById('fileInfo');
            if (fileInfo) fileInfo.textContent = `📄 ${file.name}`;
            processFileCallback(file);
        } else {
            alert('Por favor, sube un archivo CSV válido.');
        }
    }
}