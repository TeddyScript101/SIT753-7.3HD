document.addEventListener("DOMContentLoaded", () => {
    const num1Input = document.getElementById("num1");
    const num2Input = document.getElementById("num2");
    const operationSelect = document.getElementById("operation");
    const resultDisplay = document.getElementById("result");
    const calcButton = document.getElementById("calculate-btn");

    calcButton.addEventListener("click", () => {
        const num1 = parseFloat(num1Input.value);
        const num2 = parseFloat(num2Input.value);
        const operation = operationSelect.value;

        if (isNaN(num1) || isNaN(num2)) {
            resultDisplay.textContent = "Please enter valid numbers.";
            return;
        }

        let result;
        switch (operation) {
            case "+":
                result = num1 + num2;
                break;
            case "-":
                result = num1 - num2;
                break;
            case "*":
                result = num1 * num2;
                break;
            case "/":
                result = num2 !== 0 ? num1 / num2 : "Error (÷ by 0)";
                break;
            default:
                result = "Invalid operation";
        }

        resultDisplay.textContent = result;
    });
});
