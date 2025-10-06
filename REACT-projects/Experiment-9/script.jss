class Person {
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    displayInfo() {
      return `Name: ${this.name}, Age: ${this.age}`;
    }
  }
  
  class Student extends Person {
    constructor(name, age, course) {
      super(name, age);
      this.course = course;
    }
    displayInfo() {
      return `${super.displayInfo()}, Course: ${this.course}`;
    }
  }
  
  class Teacher extends Person {
    constructor(name, age, subject) {
      super(name, age);
      this.subject = subject;
    }
    displayInfo() {
      return `${super.displayInfo()}, Subject: ${this.subject}`;
    }
  }
  
  const student1 = new Student("Alice", 20, "Computer Science");
  const teacher1 = new Teacher("Mr. Smith", 40, "Mathematics");
  
  const outputDiv = document.getElementById("output");
  
  function createCard(content, type) {
    const div = document.createElement("div");
    div.className = `card ${type}`;
    div.textContent = content;
    return div;
  }
  
  outputDiv.appendChild(createCard(student1.displayInfo(), "student"));
  outputDiv.appendChild(createCard(teacher1.displayInfo(), "teacher"));
  