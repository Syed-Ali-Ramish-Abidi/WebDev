const fileInput = document.querySelector("#image-input"),
    filterOptions = document.querySelectorAll(".filter-options button"),
    filterName = document.querySelector(".slider-info .name"),
    filterValue = document.querySelector(".slider-info .value"),
    filterSlider = document.querySelector(".slider-info + input"),
    rotateOptions = document.querySelectorAll(".rotate-options button"),
    canvas = document.querySelector("#canvas"),
    previewImg = document.querySelector(".preview-img img"),
    resetFilterBtn = document.querySelector(".reset-filter"),
    chooseImgBtn = document.querySelector(".choose-img"),
    saveImgBtn = document.querySelector(".save-img"),
    undoBtn = document.querySelector(".undo-btn"),
    redoBtn = document.querySelector(".redo-btn"),
    historyList = document.querySelector(".history-list"),
    ctx = canvas.getContext("2d");

// Roll Number Logic: 0651 (Odd) -> Step size = 3
const STEP_SIZE = 3;

// Initial filter values
let brightness = 100, saturation = 100, inversion = 0, grayscale = 0, sepia = 0, blur = 0;
let rotate = 0, flipH = 1, flipV = 1;

let activeFilter = "brightness";

// History Management
let historyStack = [];
let historyIndex = -1;

const saveState = (actionName) => {
    // If we are in the middle of history and make a new change, 
    // remove all forward history
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }

    const state = {
        brightness, saturation, inversion, grayscale, sepia, blur,
        rotate, flipH, flipV,
        activeFilter
    };

    // Deep copy state just to be safe (though primitives are by value)
    historyStack.push({ state: JSON.parse(JSON.stringify(state)), action: actionName });
    historyIndex++;

    console.log(`State Saved: ${actionName}. Index: ${historyIndex}. Stack Size: ${historyStack.length}`);
    updateHistoryUI();
    updateUndoRedoButtons();
};

const updateHistoryUI = () => {
    historyList.innerHTML = "";
    historyStack.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = item.action;
        if (index === historyIndex) {
            li.classList.add("active");
        }
        li.addEventListener("click", () => jumpToHistory(index));
        historyList.appendChild(li);
    });
    historyList.scrollTop = historyList.scrollHeight;
};

const updateUndoRedoButtons = () => {
    // Undo is possible if index > 0 (can go back to 0)
    undoBtn.disabled = historyIndex <= 0;
    // Redo is possible if index < length - 1
    redoBtn.disabled = historyIndex >= historyStack.length - 1;
};

const jumpToHistory = (index) => {
    if (index < 0 || index >= historyStack.length) return;

    console.log(`Jumping to History Index: ${index}`);
    historyIndex = index;
    const item = historyStack[historyIndex];
    restoreState(item.state);

    updateHistoryUI();
    updateUndoRedoButtons();
    applyFilters();
};

const restoreState = (state) => {
    // Restore Globals
    brightness = state.brightness;
    saturation = state.saturation;
    inversion = state.inversion;
    grayscale = state.grayscale;
    sepia = state.sepia;
    blur = state.blur;
    rotate = state.rotate;
    flipH = state.flipH;
    flipV = state.flipV;
    activeFilter = state.activeFilter;

    // Update UI - Filters
    document.querySelector(".filter-options .active").classList.remove("active");
    const activeBtn = document.querySelector(`#${activeFilter}`);
    if (activeBtn) activeBtn.classList.add("active");

    filterName.innerText = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);

    // Update Slider Ranges and Values
    if (activeFilter === "brightness") {
        filterSlider.max = "200";
        filterSlider.value = brightness;
        filterValue.innerText = `${brightness}%`;
    } else if (activeFilter === "saturation") {
        filterSlider.max = "200";
        filterSlider.value = saturation;
        filterValue.innerText = `${saturation}%`;
    } else if (activeFilter === "inversion") {
        filterSlider.max = "100";
        filterSlider.value = inversion;
        filterValue.innerText = `${inversion}%`;
    } else if (activeFilter === "grayscale") {
        filterSlider.max = "100";
        filterSlider.value = grayscale;
        filterValue.innerText = `${grayscale}%`;
    } else if (activeFilter === "sepia") {
        filterSlider.max = "100";
        filterSlider.value = sepia;
        filterValue.innerText = `${sepia}%`;
    } else if (activeFilter === "blur") {
        filterSlider.max = "20";
        filterSlider.value = blur;
        filterValue.innerText = `${blur}px`;
    }

    // Update Rotate UI
    const rotateSlider = document.querySelector(".rotate-slider");
    if (rotateSlider) rotateSlider.value = rotate;
    const rotateVal = document.querySelectorAll(".slider-info .value")[1];
    if (rotateVal) rotateVal.innerText = `${rotate} deg`;

    console.log("State Restored:", state);
};

const loadImage = () => {
    let file = fileInput.files[0];
    if (!file) return;
    previewImg.src = URL.createObjectURL(file);
    previewImg.addEventListener("load", () => {
        // Reset Logic without double stacking
        brightness = 100; saturation = 100; inversion = 0; grayscale = 0; sepia = 0; blur = 0;
        rotate = 0; flipH = 1; flipV = 1;
        activeFilter = "brightness";

        // Reset active filter UI
        filterOptions[0].click();

        // Reset History
        historyStack = [];
        historyIndex = -1;
        saveState("Original Image"); // This calculates and pushes logic

        applyFilters();
    });
}

const applyFilters = () => {
    // Reset Canvas State
    canvas.width = previewImg.naturalWidth;
    canvas.height = previewImg.naturalHeight;

    // Ensure Context is clean
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply CSS Filters
    ctx.filter = `brightness(${brightness}%) saturate(${saturation}%) invert(${inversion}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px)`;

    // Transforms
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (rotate !== 0) {
        ctx.rotate(rotate * Math.PI / 180);
    }
    ctx.scale(flipH, flipV);

    ctx.drawImage(previewImg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
}

// Event Listeners
filterOptions.forEach(option => {
    option.addEventListener("click", () => {
        document.querySelector(".filter-options .active").classList.remove("active");
        option.classList.add("active");
        filterName.innerText = option.innerText;
        activeFilter = option.id;

        // Set Slider Constraints based on active filter
        if (option.id === "brightness") {
            filterSlider.max = "200";
            filterSlider.value = brightness;
            filterValue.innerText = `${brightness}%`;
        } else if (option.id === "saturation") {
            filterSlider.max = "200";
            filterSlider.value = saturation;
            filterValue.innerText = `${saturation}%`;
        } else if (option.id === "inversion") {
            filterSlider.max = "100";
            filterSlider.value = inversion;
            filterValue.innerText = `${inversion}%`;
        } else if (option.id === "grayscale") {
            filterSlider.max = "100";
            filterSlider.value = grayscale;
            filterValue.innerText = `${grayscale}%`;
        } else if (option.id === "sepia") {
            filterSlider.max = "100";
            filterSlider.value = sepia;
            filterValue.innerText = `${sepia}%`;
        } else if (option.id === "blur") {
            filterSlider.max = "20";
            filterSlider.value = blur;
            filterValue.innerText = `${blur}px`;
        }
    });
});

const updateFilter = () => {
    filterValue.innerText = (activeFilter === "blur") ? `${filterSlider.value}px` : `${filterSlider.value}%`;
    // Ensure we parse values as numbers
    const val = parseFloat(filterSlider.value);

    if (activeFilter === "brightness") brightness = val;
    else if (activeFilter === "saturation") saturation = val;
    else if (activeFilter === "inversion") inversion = val;
    else if (activeFilter === "grayscale") grayscale = val;
    else if (activeFilter === "sepia") sepia = val;
    else if (activeFilter === "blur") blur = val;

    applyFilters();
}

filterSlider.addEventListener("input", updateFilter);
filterSlider.addEventListener("change", () => {
    saveState(`${filterName.innerText}: ${filterValue.innerText}`);
});

rotateOptions.forEach(option => {
    option.addEventListener("click", () => {
        if (option.id === "left") rotate -= 90;
        else if (option.id === "right") rotate += 90;
        else if (option.id === "horizontal") flipH = flipH === 1 ? -1 : 1;
        else if (option.id === "vertical") flipV = flipV === 1 ? -1 : 1;

        applyFilters();

        // Sync Slider UI if it exists
        const rotateSlider = document.querySelector(".rotate-slider");
        if (rotateSlider) rotateSlider.value = rotate;
        const rotateVal = document.querySelectorAll(".slider-info .value")[1];
        if (rotateVal) rotateVal.innerText = `${rotate} deg`;

        let actionText = "";
        if (option.id === "left" || option.id === "right") actionText = `Rotate ${rotate}deg`;
        else if (option.id === "horizontal") actionText = `Flip H`;
        else actionText = `Flip V`;

        saveState(actionText);
    });
});

const rotateSlider = document.querySelector(".rotate-slider");
const rotateValueLabel = document.querySelectorAll(".slider-info .value")[1];

if (rotateSlider) {
    rotateSlider.addEventListener("input", () => {
        rotate = parseInt(rotateSlider.value);
        if (rotateValueLabel) rotateValueLabel.innerText = `${rotate} deg`;
        applyFilters();
    });
    rotateSlider.addEventListener("change", () => {
        saveState(`Rotate ${rotate}deg`);
    });
}

const resetFilter = () => {
    brightness = 100; saturation = 100; inversion = 0; grayscale = 0; sepia = 0; blur = 0;
    rotate = 0; flipH = 1; flipV = 1;
    activeFilter = "brightness";
    filterOptions[0].click();

    // Reset Rotate UI
    if (rotateSlider) rotateSlider.value = 0;
    if (rotateValueLabel) rotateValueLabel.innerText = "0 deg";

    applyFilters();
    saveState("Reset Filters");
}

resetFilterBtn.addEventListener("click", resetFilter);

undoBtn.addEventListener("click", () => {
    if (historyIndex > 0) {
        historyIndex--;
        jumpToHistory(historyIndex);
    }
});

redoBtn.addEventListener("click", () => {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        jumpToHistory(historyIndex);
    }
});

const saveImage = () => {
    const link = document.createElement("a");
    link.download = "image.jpg";
    link.href = canvas.toDataURL();
    link.click();
}

saveImgBtn.addEventListener("click", saveImage);
fileInput.addEventListener("change", loadImage);
chooseImgBtn.addEventListener("click", () => fileInput.click());
