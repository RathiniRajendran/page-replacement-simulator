let results = {};

function getInput() {
    let frames = parseInt(document.getElementById("frames").value);
    let text = document.getElementById("refs").value.trim();

    if (isNaN(frames) || frames <= 0) {
        alert("Enter a valid number of frames");
        return null;
    }

    if (text === "") {
        alert("Enter a reference string");
        return null;
    }

    let refs = text.split(" ").map(Number);

    for (let i = 0; i < refs.length; i++) {
        if (isNaN(refs[i])) {
            alert("Reference string must contain only numbers");
            return null;
        }
    }

    return { frames: frames, refs: refs };
}

function fifo(refs, capacity) {
    let frames = [];
    let order = [];
    let faults = 0;
    let steps = [];

    for (let i = 0; i < refs.length; i++) {
        let page = refs[i];
        let hit = false;
        let replaced = "-";

        if (frames.includes(page)) {
            hit = true;
        } else {
            faults++;

            if (frames.length < capacity) {
                frames.push(page);
                order.push(page);
            } else {
                let oldPage = order.shift();
                let index = frames.indexOf(oldPage);
                frames[index] = page;
                order.push(page);
                replaced = oldPage;
            }
        }

        steps.push({
            page: page,
            hit: hit,
            replaced: replaced,
            frames: [...frames]
        });
    }

    return { faults: faults, steps: steps };
}

function lru(refs, capacity) {
    let frames = [];
    let lastUsed = {};
    let faults = 0;
    let steps = [];

    for (let i = 0; i < refs.length; i++) {
        let page = refs[i];
        let hit = false;
        let replaced = "-";

        if (frames.includes(page)) {
            hit = true;
            lastUsed[page] = i;
        } else {
            faults++;

            if (frames.length < capacity) {
                frames.push(page);
            } else {
                let victim = frames[0];

                for (let j = 1; j < frames.length; j++) {
                    if (lastUsed[frames[j]] < lastUsed[victim]) {
                        victim = frames[j];
                    }
                }

                let index = frames.indexOf(victim);
                frames[index] = page;
                replaced = victim;
                delete lastUsed[victim];
            }

            lastUsed[page] = i;
        }

        steps.push({
            page: page,
            hit: hit,
            replaced: replaced,
            frames: [...frames]
        });
    }

    return { faults: faults, steps: steps };
}

function lfu(refs, capacity) {
    let frames = [];
    let count = {};
    let lastUsed = {};
    let faults = 0;
    let steps = [];

    for (let i = 0; i < refs.length; i++) {
        let page = refs[i];
        let hit = false;
        let replaced = "-";

        if (frames.includes(page)) {
            hit = true;
            count[page] = count[page] + 1;
            lastUsed[page] = i;
        } else {
            faults++;

            if (frames.length < capacity) {
                frames.push(page);
            } else {
                let victim = frames[0];

                for (let j = 1; j < frames.length; j++) {
                    let p = frames[j];

                    if (count[p] < count[victim]) {
                        victim = p;
                    } else if (count[p] === count[victim]) {
                        if (lastUsed[p] < lastUsed[victim]) {
                            victim = p;
                        }
                    }
                }

                let index = frames.indexOf(victim);
                frames[index] = page;
                replaced = victim;

                delete count[victim];
                delete lastUsed[victim];
            }

            count[page] = 1;
            lastUsed[page] = i;
        }

        steps.push({
            page: page,
            hit: hit,
            replaced: replaced,
            frames: [...frames]
        });
    }

    return { faults: faults, steps: steps };
}

function mfu(refs, capacity) {
    let frames = [];
    let count = {};
    let lastUsed = {};
    let faults = 0;
    let steps = [];

    for (let i = 0; i < refs.length; i++) {
        let page = refs[i];
        let hit = false;
        let replaced = "-";

        if (frames.includes(page)) {
            hit = true;
            count[page] = count[page] + 1;
            lastUsed[page] = i;
        } else {
            faults++;

            if (frames.length < capacity) {
                frames.push(page);
            } else {
                let victim = frames[0];

                for (let j = 1; j < frames.length; j++) {
                    let p = frames[j];

                    if (count[p] > count[victim]) {
                        victim = p;
                    } else if (count[p] === count[victim]) {
                        if (lastUsed[p] < lastUsed[victim]) {
                            victim = p;
                        }
                    }
                }

                let index = frames.indexOf(victim);
                frames[index] = page;
                replaced = victim;

                delete count[victim];
                delete lastUsed[victim];
            }

            count[page] = 1;
            lastUsed[page] = i;
        }

        steps.push({
            page: page,
            hit: hit,
            replaced: replaced,
            frames: [...frames]
        });
    }

    return { faults: faults, steps: steps };
}

function run() {
    let input = getInput();

    if (input === null) {
        return;
    }

    let refs = input.refs;
    let frames = input.frames;

    results["FIFO"] = fifo(refs, frames);
    results["LRU"] = lru(refs, frames);
    results["LFU"] = lfu(refs, frames);
    results["MFU"] = mfu(refs, frames);

    showSummary(refs.length);
    showSteps(document.getElementById("algoSelect").value);
}

function showSummary(totalRefs) {
    let body = document.getElementById("summaryBody");
    body.innerHTML = "";

    let minFaults = results["FIFO"].faults;
    let bestList = [];

    for (let name in results) {
        if (results[name].faults < minFaults) {
            minFaults = results[name].faults;
        }
    }

    for (let name in results) {
        if (results[name].faults === minFaults) {
            bestList.push(name);
        }
    }

    document.getElementById("bestText").innerHTML =
        "Best Algorithm: " + bestList.join(", ") + " (Faults = " + minFaults + ")";

    for (let name in results) {
        let faults = results[name].faults;
        let hits = totalRefs - faults;
        let rate = ((faults / totalRefs) * 100).toFixed(2) + "%";

        body.innerHTML +=
            "<tr>" +
            "<td>" + name + (faults === minFaults ? ' <span class="best">(Best)</span>' : '') + "</td>" +
            "<td>" + faults + "</td>" +
            "<td>" + hits + "</td>" +
            "<td>" + rate + "</td>" +
            "</tr>";
    }
}

function showSteps(name) {
    let body = document.getElementById("stepsBody");
    body.innerHTML = "";

    let steps = results[name].steps;
    let faults = results[name].faults;
    let hits = steps.length - faults;

    document.getElementById("selectedInfo").innerHTML =
        "Selected Algorithm: " + name + " | Faults: " + faults + " | Hits: " + hits;

    for (let i = 0; i < steps.length; i++) {
        let step = steps[i];
        let resultText = step.hit ? "HIT" : "FAULT";
        let colorClass = step.hit ? "hit" : "fault";

        body.innerHTML +=
            "<tr>" +
            "<td>" + (i + 1) + "</td>" +
            "<td>" + step.page + "</td>" +
            '<td class="' + colorClass + '">' + resultText + "</td>" +
            "<td>" + step.replaced + "</td>" +
            "<td>" + step.frames.join(" | ") + "</td>" +
            "</tr>";
    }
}

document.getElementById("run").onclick = run;

document.getElementById("algoSelect").onchange = function () {
    if (Object.keys(results).length > 0) {
        showSteps(this.value);
    }
};