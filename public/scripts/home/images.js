const small = 195
const large = small * 2
const margin = large / 100

$(document).ready(function () {
    moveImageLeft("#onePics", small, 0); // 200
    moveImageTop("#twoPics", small + margin, 0); // 205
    moveImageTop("#threePics", large + margin, 0); // 405
    moveImageLeft("#fourPics", small, 0); // 200
});


const moveImageTop = async function (selector, Mtop, i) {
    if (i == 3) {
        $(selector).animate({
            "margin-top": "0px"
        }, "slow").delay(5000);

        i = 0;
        i++;
        moveImageTop(selector, Mtop, i);
    } else {
        $(selector).animate({
            "margin-top": `-=${Mtop}px`
        }, "slow").delay(5000);

        i++;
        moveImageTop(selector, Mtop, i);
    }
}

const moveImageLeft = async function (selector, Mtop, i) {
    if (i == 3) {
        $(selector).animate({
            "margin-left": "0px"
        }, "slow").delay(5000);

        i = 0;
        i++;
        moveImageLeft(selector, Mtop, i);
    } else {
        $(selector).animate({
            "margin-left": `-=${Mtop}px`
        }, "slow").delay(5000);

        i++;
        moveImageLeft(selector, Mtop, i);
    }
}
