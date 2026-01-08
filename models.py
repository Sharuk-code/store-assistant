from pydantic import BaseModel
from typing import Optional, List

class ProductBase(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    price: float
    cost: Optional[float] = 0.0
    stock_qty: int = 0
    is_serialized: bool = False
    branch_id: Optional[int] = 1
    product_type: str = 'PHYSICAL' # 'PHYSICAL' or 'SERVICE'

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

# --- User Models ---

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = 'staff'
    branch_id: int = 1

class User(BaseModel):
    id: int
    username: str
    role: str
    branch_id: int

    class Config: from_attributes = True

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None

class Supplier(SupplierCreate):
    id: int
    class Config: from_attributes = True

class PurchaseItemCreate(BaseModel):
    product_id: int
    qty: int
    cost_price: float

class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_no: Optional[str] = None
    items: List[PurchaseItemCreate]
    total_amount: float
    branch_id: int = 1

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class Customer(CustomerCreate):
    id: int
    created_at: Optional[str] = None

# --- Sales Models ---

class SaleItemCreate(BaseModel):
    product_id: int
    product_name: Optional[str] = None # Allow overriding name (e.g. for services)
    job_no: Optional[str] = None # For linking back to repair jobs
    qty: int
    price: float # Snapshot price at time of sale

class SaleCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    payment_mode: str = 'CASH'
    discount: float = 0.0
    items: List[SaleItemCreate]
    branch_id: int = 1

class Sale(SaleCreate):
    id: int
    invoice_no: str
    date: str
    total: float
    discount: float = 0.0
    
    class Config:
        from_attributes = True

# --- Job Models ---

class JobCreate(BaseModel):
    customer_name: str
    customer_phone: str
    device_model: str
    issue_description: str
    estimated_cost: Optional[float] = 0.0
    advance_amount: Optional[float] = 0.0
    status: str = 'RECEIVED'
    branch_id: int = 1
    repair_notes: Optional[str] = None # Description of work done
    technician: Optional[str] = None # Username of technician

class Job(JobCreate):
    id: int
    job_no: str
    created_at: str
    
    class Config:
        from_attributes = True
