-- Tạo database
CREATE DATABASE chatbotdb;

-- Chuyển sang database mới tạo
\c chatbotdb;

-- Bảng phòng ban
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    manager_id INT NULL -- sẽ cập nhật sau
);

-- Bảng nhân viên
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    position VARCHAR(100),
    department_id INT,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Cập nhật khóa ngoại cho manager_id
ALTER TABLE departments
ADD CONSTRAINT fk_manager
FOREIGN KEY (manager_id) REFERENCES employees(employee_id);

-- Bảng sản phẩm
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng kho hàng
CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(100) NOT NULL,
    location VARCHAR(255)
);

-- Bảng tồn kho
CREATE TABLE inventory_levels (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, warehouse_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

-- Bảng nhật ký chấm công
CREATE TABLE attendance_logs (
    log_id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'absent',
    notes TEXT,
    UNIQUE (employee_id, log_date),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- Bảng tài liệu gốc
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20),
    storage_url VARCHAR(1024) NOT NULL,
    summary TEXT,
    owner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES employees(employee_id)
);

-- Bảng phân quyền tài liệu
CREATE TABLE document_permissions (
    permission_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,
    department_id INT NULL,
    employee_id INT NULL,
    UNIQUE (document_id, department_id, employee_id),
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

-- Bảng document chunks (cho AI)
CREATE TABLE document_chunks (
    chunk_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,
    chunk_text TEXT NOT NULL,
    page_number INT,
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);
