const inputNum = document.getElementById('input_area');
const numBtn = document.getElementsByClassName("num_btn");
const operatorbtn = document.getElementsByClassName("operator_btn");
const keys = document.querySelectorAll(".num_btn, .operator_btn");

keys.forEach(key => {
    key.addEventListener("click", display);
});

for (let i = 0; i < operatorbtn.length; i++){
    if (operatorbtn[i].textContent === "C"){
        operatorbtn[i].addEventListener('click', clear)
    }
    else if (operatorbtn[i].textContent === "="){
        operatorbtn[i].addEventListener('click', calculate)
    }
}

function display(event) {
    if (event.target.textContent === "=" || event.target.textContent === "C") return;

    inputNum.value += event.target.textContent;
}


function clear() {
    inputNum.value = "";

}

function calculate() {
  
  try {
    let expression = inputNum.value
        .replace(/×/g,"*")
        .replace(/÷/g,"/");
    inputNum.value = eval(expression);
  
} catch {
    inputNum.value = "error";
  }
  
}

