const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".navlinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isExpanded));
        menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
        navLinks.classList.toggle("is-open", !isExpanded);
    });

    navLinks.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
            navLinks.classList.remove("is-open");
        }
    });
}

const year = document.querySelector("#current-year");
if (year) {
    year.textContent = String(new Date().getFullYear());
}

const carSearch = document.querySelector("#car-search");
const carType = document.querySelector("#car-type");
const carPriceMin = document.querySelector("#car-price-min");
const carPriceMax = document.querySelector("#car-price-max");
const carListings = document.querySelector("#car-listings");
const inventoryResults = document.querySelector("#inventory-results");
const inventoryEmpty = document.querySelector("#inventory-empty");
const inventoryError = document.querySelector("#inventory-error");

const initializeCarGalleries = () => {
    document.querySelectorAll(".car-gallery").forEach((gallery, galleryIndex) => {
        const slides = Array.from(gallery.querySelectorAll(".car-photo"));
        if (slides.length < 2) {
            return;
        }

        const carName = gallery.closest(".car-card")?.querySelector("h3")?.textContent.trim() || "vehicle";
        const controls = document.createElement("div");
        const previousButton = document.createElement("button");
        const nextButton = document.createElement("button");
        const counter = document.createElement("span");
        const status = document.createElement("span");
        let activeSlide = 0;
        let touchStartX = null;

        gallery.setAttribute("role", "group");
        gallery.setAttribute("aria-roledescription", "carousel");
        gallery.setAttribute("aria-label", `${carName} photos`);
        gallery.classList.add("is-carousel");
        gallery.id = `car-gallery-${galleryIndex + 1}`;

        controls.className = "carousel-controls";
        previousButton.className = "carousel-arrow is-previous";
        previousButton.type = "button";
        previousButton.setAttribute("aria-label", `Previous ${carName} photo`);
        previousButton.setAttribute("aria-controls", gallery.id);
        nextButton.className = "carousel-arrow";
        nextButton.type = "button";
        nextButton.setAttribute("aria-label", `Next ${carName} photo`);
        nextButton.setAttribute("aria-controls", gallery.id);
        counter.className = "carousel-counter";
        counter.setAttribute("aria-label", `${carName} photo count`);
        status.className = "visually-hidden";
        status.setAttribute("aria-live", "polite");
        status.setAttribute("aria-atomic", "true");

        slides.forEach((slide, slideIndex) => {
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-roledescription", "slide");
            slide.setAttribute("aria-label", `${slideIndex + 1} of ${slides.length}`);
        });

        const showSlide = (slideIndex) => {
            activeSlide = (slideIndex + slides.length) % slides.length;
            slides.forEach((slide, index) => {
                const isActive = index === activeSlide;
                slide.classList.toggle("is-active", isActive);
                slide.hidden = !isActive;
            });
            counter.textContent = `${activeSlide + 1} / ${slides.length}`;
            status.textContent = `Photo ${activeSlide + 1} of ${slides.length}`;
        };

        previousButton.addEventListener("click", () => showSlide(activeSlide - 1));
        nextButton.addEventListener("click", () => showSlide(activeSlide + 1));

        gallery.addEventListener("touchstart", (event) => {
            touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });

        gallery.addEventListener("touchend", (event) => {
            if (touchStartX === null) {
                return;
            }
            const swipeDistance = event.changedTouches[0].clientX - touchStartX;
            touchStartX = null;
            if (Math.abs(swipeDistance) > 45) {
                showSlide(activeSlide + (swipeDistance < 0 ? 1 : -1));
            }
        }, { passive: true });

        controls.append(previousButton, counter, nextButton);
        gallery.append(controls, status);
        showSlide(0);
    });
};

if (carSearch && carType && carPriceMin && carPriceMax && carListings && inventoryResults && inventoryEmpty && inventoryError) {
    let carCards = [];

    const filterCars = () => {
        const searchTerm = carSearch.value.trim().toLocaleLowerCase();
        const selectedType = carType.value;
        const minimumPrice = carPriceMin.value === "" ? null : carPriceMin.valueAsNumber;
        const maximumPrice = carPriceMax.value === "" ? null : carPriceMax.valueAsNumber;
        const invalidPriceInput = (minimumPrice !== null && (!Number.isFinite(minimumPrice) || minimumPrice < 0))
            || (maximumPrice !== null && (!Number.isFinite(maximumPrice) || maximumPrice < 0));
        const invalidPriceRange = minimumPrice !== null && maximumPrice !== null && minimumPrice > maximumPrice;
        let visibleCount = 0;

        carPriceMin.setAttribute("aria-invalid", String(invalidPriceInput || invalidPriceRange));
        carPriceMax.setAttribute("aria-invalid", String(invalidPriceInput || invalidPriceRange));

        if (invalidPriceInput || invalidPriceRange) {
            inventoryResults.textContent = invalidPriceRange
                ? "Minimum price must not exceed maximum price."
                : "Prices must be zero or more.";
            inventoryEmpty.hidden = true;
            carCards.forEach((card) => {
                card.hidden = true;
            });
            return;
        }

        carCards.forEach((card) => {
            const matchesSearch = (card.dataset.search || "").toLocaleLowerCase().includes(searchTerm);
            const matchesType = selectedType === "all" || card.dataset.type === selectedType;
            const price = card.dataset.price ? Number(card.dataset.price) : null;
            const hasPriceFilter = minimumPrice !== null || maximumPrice !== null;
            const matchesPrice = !hasPriceFilter || (price !== null
                && Number.isFinite(price)
                && (minimumPrice === null || price >= minimumPrice)
                && (maximumPrice === null || price <= maximumPrice));
            const isVisible = matchesSearch && matchesType && matchesPrice;

            card.hidden = !isVisible;
            if (isVisible) {
                visibleCount += 1;
            }
        });

        inventoryResults.textContent = visibleCount === carCards.length
            ? `Showing all ${visibleCount} vehicles`
            : `Showing ${visibleCount} of ${carCards.length} vehicles`;
        inventoryEmpty.hidden = visibleCount > 0;
    };

    const createCarCard = (car) => {
        const title = [car.year, car.make, car.model].filter(Boolean).join(" ");
        const card = document.createElement("article");
        card.className = "car-card";
        card.dataset.type = car.type;
        card.dataset.search = [car.year, car.make, car.model, ...(car.features || [])].join(" ");
        const priceDigits = String(car.price || "").replace(/\D/g, "");
        if (priceDigits) {
            card.dataset.price = String(Number(priceDigits));
        }

        const gallery = document.createElement("div");
        gallery.className = "car-gallery";
        const photos = Array.isArray(car.photos) ? car.photos : [];
        photos.forEach((photo, index) => {
            const image = document.createElement("img");
            image.className = "car-photo";
            if (index === 0) {
                image.classList.add("car-photo-main");
            }
            if (Array.isArray(car.containPhotos) && car.containPhotos.includes(photo)) {
                image.classList.add("car-photo-contain");
            }
            image.src = photo;
            image.alt = `${index === 0 ? "Main" : `Photo ${index + 1}`} of the ${title}`;
            image.loading = "lazy";
            gallery.append(image);
        });

        const details = document.createElement("div");
        details.className = "car-details";
        const tag = document.createElement("p");
        tag.className = "car-tag";
        if (car.status === "sold") {
            tag.classList.add("is-sold");
        }
        const tagDot = document.createElement("span");
        tag.append(tagDot, document.createTextNode(car.status === "sold" ? " SOLD" : " AVAILABLE NOW"));
        details.append(tag);

        if (car.year) {
            const year = document.createElement("p");
            year.className = "car-year";
            year.textContent = car.year;
            details.append(year);
        }

        const heading = document.createElement("h3");
        heading.append(document.createTextNode(`${car.make} `));
        const model = document.createElement("span");
        model.textContent = car.model;
        heading.append(model);
        details.append(heading);

        if (car.mileage) {
            const mileage = document.createElement("p");
            mileage.className = "car-mileage";
            mileage.textContent = car.mileage;
            details.append(mileage);
        }

        (Array.isArray(car.features) ? car.features : []).forEach((feature) => {
            const featureText = document.createElement("p");
            featureText.className = "car-feature";
            featureText.textContent = feature;
            details.append(featureText);
        });

        const price = document.createElement("p");
        price.className = "car-price";
        price.append(document.createTextNode(car.price || ""));
        if (car.priceNote) {
            const priceNote = document.createElement("span");
            priceNote.className = "price-note";
            priceNote.textContent = car.priceNote;
            price.append(priceNote);
        }
        details.append(price);

        const note = document.createElement("p");
        note.className = "car-note";
        note.textContent = "Contact Jare Autos for more information or to arrange a viewing.";
        details.append(note);

        if (car.status !== "sold") {
            const inquiry = document.createElement("a");
            inquiry.className = "button button-gold car-inquiry";
            inquiry.href = `https://wa.me/2347046703618?text=${encodeURIComponent(`Hi Jare Autos, I'm interested in the ${title}.`)}`;
            inquiry.append(document.createTextNode("Enquire about this car "));
            const arrow = document.createElement("span");
            arrow.setAttribute("aria-hidden", "true");
            arrow.textContent = "→";
            inquiry.append(arrow);
            details.append(inquiry);
        }

        card.append(gallery, details);
        return card;
    };

    carSearch.addEventListener("input", filterCars);
    carType.addEventListener("change", filterCars);
    carPriceMin.addEventListener("input", filterCars);
    carPriceMax.addEventListener("input", filterCars);
    carListings.replaceChildren();

    fetch("content/cars.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Inventory request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then((inventory) => {
            if (!inventory || !Array.isArray(inventory.cars)) {
                throw new Error("Inventory data is missing its cars list");
            }
            carListings.replaceChildren(...inventory.cars.map(createCarCard));
            carCards = Array.from(carListings.querySelectorAll(".car-card"));
            initializeCarGalleries();
            filterCars();
        })
        .catch((error) => {
            console.error("Could not load vehicle inventory.", error);
            inventoryResults.textContent = "";
            inventoryError.hidden = false;
        });
}
