import '@babel/polyfill' // 이 라인을 지우지 말아주세요!

import axios from 'axios'
import { runMain } from 'module';

const api = axios.create({
  baseURL: process.env.API_URL
})

api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
});

const templates = {
  mainPage: document.querySelector('#main-page').content,
  loginForm: document.querySelector('#login-form').content,
  listPage: document.querySelector('#list-page').content,
  productItem: document.querySelector('#product-item').content,
  productPage: document.querySelector('#product-page').content,
  cart: document.querySelector('#cart').content,
  cartItem: document.querySelector('#cart-item').content
}

const rootEl = document.querySelector('.root')

// 페이지 그리는 함수 작성 순서
// 1. 템플릿 복사
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입

async function drawMain(){
  const frag = document.importNode(templates.mainPage, true)

  rootEl.textContent =''
  rootEl.appendChild(frag)
}

async function loginForm(){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.loginForm, true)

  // 2. 요소 선택
  const formEl = frag.querySelector('.login-form')

  // 3. 필요한 데이터 불러오기
  // 4. 내용 채우기
  // 5. 이벤트 리스너 등록하기
  formEl.addEventListener('submit', async e=>{
    e.preventDefault()
    const username = e.target.elements.username.value
    const password = e.target.elements.password.value

    const res = await api.post('/users/login',{
      username,
      password
    })

    localStorage.setItem('token', res.data.token)
    drawMain()
  })

  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

// 상품 목록
async function productList(category){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.listPage, true)
  // 2. 요소 선택
  const productListEl = frag.querySelector('.product-list')
  const listTitleEl = frag.querySelector('.list-title')
  // 3. 필요한 데이터 불러오기
  // 해당 카테고리의 상품들만 불러오기
  const {data: productList} = await api.get('/products',{
    params: {
      category,
      _embed: 'options'
    }
  })
  // 4. 내용 채우기
  // 제목 채우기
  listTitleEl.textContent = category
  // 해당 카테고리의 상품 하나하나를 순회하면서 상품 프리뷰 채우기
  for(const item of productList){
    // 1. 템플릿 복사
    const frag = document.importNode(templates.productItem, true)
    // 2. 요소 선택
    const thumbEl = frag.querySelector('.product-thumb')
    const titleEl = frag.querySelector('.product-title')
    const amountEl = frag.querySelector('.product-amount')
    // 3. 필요한 데이터 불러오기
    // 4. 내용 채우기
    thumbEl.setAttribute('src', item.mainImgUrl)
    titleEl.textContent = item.title
    amountEl.textContent = item.options[0].price
    // 5. 이벤트 리스너 등록하기

    // 상품 상세 창으로 이동하는 이벤트리스너 넣기
    thumbEl.addEventListener('click', e=>{
      productDetail(item.id)
    })
    // 6. 템플릿을 문서에 삽입
    productListEl.appendChild(frag)
  }
  // 5. 이벤트 리스너 등록하기
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent =''
  rootEl.appendChild(frag)
}

// 수량에 따른 가격 변동 함수
function total(price, quantity){
  return price*quantity
}

// 상품 상세 페이지 출력 함수
async function productDetail(id){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.productPage, true)
  // 2. 요소 선택
  const categoryEl = frag.querySelector('.category-title')
  const titleEl = frag.querySelector('.title')
  const imageEl = frag.querySelector('.image')
  const descriptionEl = frag.querySelector('.info .description').querySelector('dd')
  const quantityEl = frag.querySelector('.info .quantity').querySelector('select')
  const amountEl = frag.querySelector('.info .amount').querySelector('dd')
  const cartButtonEl = frag.querySelector('.to-cart')

  // 3. 필요한 데이터 불러오기
  // 해당 상품 자원 불러오기
  const {data: productItem} = await api.get('/products/'+id)
  const {data: option} = await api.get('/options',{
    params:{
      productId: id
    }
  })
  const price = option.price

  // 4. 내용 채우기
  categoryEl.textContent = productItem.category
  titleEl.textContent = productItem.title
  imageEl.setAttribute('src', productItem.mainImgUrl)
  descriptionEl.textContent = productItem.description
  amountEl.textContent = total(price, quantityEl.value)

  // 5. 이벤트 리스너 등록하기
  // 상단 카테고리 이름 클릭 시 다시 상품 목록 페이지로 이동
  categoryEl.addEventListener('click', e => {
    productList(productItem.category)
  })

  // 수량 선택 변화 시 총 금액 갱신
  quantityEl.addEventListener('change', e=> {
    amountEl.textContent = total(price, quantityEl.value)
  })

  // 장바구니 담기&장바구니 페이지로 이동
  cartButtonEl.addEventListener('click', async e=>{
    // 장바구니 담기
    await api.post('/cartItems',{
      optionId: option[0].id,
      quantity: parseInt(quantityEl.value),
      ordered: false
    })
    // 장바구니 페이지로 이동
    drawCart()
  })

  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

// 카트 페이지
async function drawCart(){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.cart, true)
  // 2. 요소 선택
  const cartListEl = frag.querySelector('.cart-list')
  const cartTotalAmountEl = frag.querySelector('.cart-amount .total-amount')
  const orderEl = frag.querySelector('.cart-order')
  let totalAmount = 0

  // 3. 필요한 데이터 불러오기
  const {data: cartItemList} = await api.get('/cartItems',{
    params:{
      ordered: false,
      _expand: 'option'
    }
  })

  // 4. 내용 채우기

  for(const cartItem of cartItemList){
    // 1. 템플릿 복사
    const frag = document.importNode(templates.cartItem, true)

    // 2. 요소 선택
    const imgEl = frag.querySelector('.cart-item-img')
    const titleEl = frag.querySelector('.cart-item-title')
    const quantityEl = frag.querySelector('.cart-item-quantity')
    const amountEl = frag.querySelector('.cart-item-amount')
    const increaseEl = frag.querySelector('.increase')
    const decreaseEl = frag.querySelector('.decrease')
    const deleteEl = frag.querySelector('.cart-item-delete')

    // 3. 필요한 데이터 불러오기
    const {data: option} = await api.get('/options/'+cartItem.optionId)
    const {data: product} = await api.get('/products/'+option.productId)

    // 4. 내용 채우기
    imgEl.setAttribute('src', product.mainImgUrl)
    titleEl.textContent = product.title
    quantityEl.setAttribute('value', cartItem.quantity)
    amountEl.textContent = total(option.price, cartItem.quantity)
    totalAmount += cartItem.option.price

    // 5. 이벤트 리스너 등록하기

    // 수량 변경 시 수량/금액 갱신
    // 수량 증가
    increaseEl.addEventListener('click', async e=> {
      if(cartItem.quantity < 5){
        await api.patch('cartItems/'+cartItem.id, {
          quantity : ++cartItem.quantity
        })
        quantityEl.setAttribute('value', cartItem.quantity)
      }
    })

    // 수량 감소
    decreaseEl.addEventListener('click', async e=> {
      if(cartItem.quantity > 2){
        await api.patch('cartItems/'+cartItem.id, {
          quantity : --cartItem.quantity
        })
        quantityEl.setAttribute('value', cartItem.quantity)
      }
    })

    // 제거버튼 클릭 시 해당 카트 아이템 제거
    deleteEl.addEventListener('click', async e=> {
      // 해당 카트 아이템 제거하고
      await api.delete('cartItems/'+cartItem.id)
      // 다시 카트페이지 그리기
      drawCart()
    })

    // 6. 템플릿을 문서에 삽입
    cartListEl.appendChild(frag)
  }

  // 총금액 표시
  cartTotalAmountEl.textContent = totalAmount

  // 5. 이벤트 리스너 등록하기
  // 주문버튼

  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

// 메뉴 이벤트리스너
const menuEl = document.querySelector('.menu')
const signinEl = document.querySelector('.menu .signin')

signinEl.addEventListener('click', e=>{
  loginForm()
  menuEl.classList.remove('act')
})

// 상품 목록 페이지 이동 이벤트리스너
const categoryEl = document.querySelector('.menu .category')
const bearEl = categoryEl.querySelector('.bear')
const kuEl = categoryEl.querySelector('.ku')
const legoEl = categoryEl.querySelector('.lego')

bearEl.addEventListener('click', e=>{
  productList('bearbrick')
  menuEl.classList.remove('act')
})

kuEl.addEventListener('click', e=>{
  productList('kubrick')
  menuEl.classList.remove('act')
})

legoEl.addEventListener('click', e=>{
  productList('brickheadz')
  menuEl.classList.remove('act')
})

// 페이지 로드 시 그릴 화면
drawMain()
