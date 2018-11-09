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
  cartItem: document.querySelector('#cart-item').content,
  ordered: document.querySelector('#ordered').content,
  eachOrdered: document.querySelector('#each-ordered').content,
  orderedItem: document.querySelector('#ordered-item').content
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
  const titleEl = frag.querySelector('.item-title')
  const imageEl = frag.querySelector('.image')
  const descriptionEl = frag.querySelector('.info .description').querySelector('dd')
  const quantityEl = frag.querySelector('.info .quantity').querySelector('select')
  const amountEl = frag.querySelector('.info .amount').querySelector('dd')
  const cartButtonEl = frag.querySelector('.to-cart')
  const orderEl = frag.querySelector('.fast-order')

  // 3. 필요한 데이터 불러오기
  // 해당 상품 자원 불러오기
  const {data: productItem} = await api.get('/products/'+id)
  const {data: option} = await api.get('/options',{
    params:{
      productId: id
    }
  })
  const price = option[0].price

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

  // 즉시 주문
  // orderEl.addEventListener('click', async e=> {
  //   // 장바구니 담기
  //   await api.post('/cartItems',{
  //     optionId: option[0].id,
  //     quantity: parseInt(quantityEl.value),
  //     ordered: true
  //   })

  //   const {data: {id: orderId}} = await api.post('/orders', {
  //     orderTime: Date.now() // 현재 시각을 나타내는 정수
  //   })

  //   for(const cartItem of cartItemList){
  //     // 위에서 만든 주문 객체의 id를 각 장바구니 항목의 orderId에 넣어줍니다.
  //     await api.patch('/cartItems/'+cartItem.id, {
  //       ordered: true,
  //       orderId
  //     })
  //   }
  // })

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
  // 옵션 정보가 있는 카트아이템들의 배열
  const {data: cartItemList} = await api.get('/cartItems',{
    params:{
      ordered: false,
      _expand: 'option'
    }
  })

  // 카트아이템에 있는 product 정보들의 배열
  const params = new URLSearchParams()
  cartItemList.forEach(c => params.append('id', c.option.productId))
  const {data: product} = await api.get('/products', {
    params
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
    const itemProduct = product.find(item => item.id === cartItem.option.productId)

    // 4. 내용 채우기
    imgEl.setAttribute('src', itemProduct.mainImgUrl)
    titleEl.textContent = itemProduct.title
    quantityEl.setAttribute('value', cartItem.quantity)
    amountEl.textContent = total(cartItem.option.price, cartItem.quantity)
    totalAmount += parseInt(amountEl.textContent)

    // 5. 이벤트 리스너 등록하기

    // 수량 변경 시 수량/금액 갱신
    // 수량 증가
    increaseEl.addEventListener('click', async e=> {
      e.preventDefault()
      if(cartItem.quantity < 5){
        await api.patch('cartItems/'+cartItem.id, {
          quantity : ++cartItem.quantity
        })
        quantityEl.setAttribute('value', cartItem.quantity)
        amountEl.textContent = total(cartItem.option.price, cartItem.quantity)
        totalAmount += cartItem.option.price
        cartTotalAmountEl.textContent = totalAmount
      }
    })

    // 수량 감소
    decreaseEl.addEventListener('click', async e=> {
      e.preventDefault()
      if(cartItem.quantity > 1){
        await api.patch('cartItems/'+cartItem.id, {
          quantity : --cartItem.quantity
        })
        quantityEl.setAttribute('value', cartItem.quantity)
        amountEl.textContent = total(cartItem.option.price, cartItem.quantity)
        totalAmount -= cartItem.option.price
        cartTotalAmountEl.textContent = totalAmount
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

  // 주문하기
  orderEl.addEventListener('click', async e=> {
    // 방금 주문한 정보 객체 생성
    const {data: {id: orderId}} = await api.post('/orders', {
      orderTime: Date.now() // 현재 시각을 나타내는 정수
    })

    for(const cartItem of cartItemList){
      // 위에서 만든 주문 객체의 id를 각 장바구니 항목의 orderId에 넣어줍니다.
      await api.patch('/cartItems/'+cartItem.id, {
        ordered: true,
        orderId
      })
    }
    // 작업이 끝났으면 주문 페이지 로드
    drawOrder()
  })

  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

async function drawOrder(){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.ordered, true)
  // 2. 요소 선택
  const orderedListEl = frag.querySelector('.ordered-list')

  // 3. 필요한 데이터 불러오기
  // 주문별로 주문된 아이템들이 배열로 들어있는 주문별 객체를 요소들로 가지고 있는 배열ㅋㅋㅋ
  const {data: orderList} = await api.get('/orders',{
    params: {
      _embed: 'cartItems'
    }
  })

  // products 정보가 있는 옵션들의 배열
  const params = new URLSearchParams()
  orderList.forEach(c => c.cartItems.forEach(c => params.append('id', c.optionId)))
  params.append('_expand', 'product')

  const {data: options} = await api.get('/options', {
    params
  })

  // 4. 내용 채우기

  for(const eachOrdered of orderList){
    // 1. 템플릿 복사
    const frag = document.importNode(templates.eachOrdered, true)

    // 2. 요소 선택
    const eachOrderedListEl = frag.querySelector('.each-ordered-list')
    const orderedAmount = frag.querySelector('.ordered-total-amount')
    const orderedIdEl = frag.querySelector('.ordered-id')
    let totalAmount = 0;

    // 3. 필요한 데이터 불러오기
    const {cartItems: orderedItemList} = eachOrdered

    // 4. 내용 채우기
    orderedIdEl.textContent = orderList.indexOf(eachOrdered) + 1

    for(const itemList of orderedItemList){
      // 1. 템플릿 복사
      const frag = document.importNode(templates.orderedItem, true)

      // 2. 요소 선택
      const orderedItem = frag.querySelector('.ordered-item')

      const itemImage = orderedItem.querySelector('.ordered-item-img')
      const itemTitle = orderedItem.querySelector('.ordered-item-title')
      const quantityEl = orderedItem.querySelector('.ordered-item-quantity')
      const amountEl = orderedItem.querySelector('.ordered-item-amount')
      // 3. 필요한 데이터 불러오기
      const itemOption = options.find(item => item.id === itemList.optionId)

      const itemAmount = total(itemOption.price, itemList.quantity)
      // 4. 내용 채우기
      itemImage.setAttribute('src', itemOption.product.mainImgUrl)
      itemTitle.textContent = itemOption.product.title
      quantityEl.textContent = itemList.quantity
      amountEl.textContent = itemAmount

      totalAmount +=itemAmount
      // 5. 이벤트 리스너 등록하기
      // 6. 템플릿을 문서에 삽입
      eachOrderedListEl.appendChild(frag)
    }

    orderedAmount.textContent = totalAmount

    // 5. 이벤트 리스너 등록하기
    // 6. 템플릿을 문서에 삽입
    orderedListEl.appendChild(frag)
  }

  // 5. 이벤트 리스너 등록하기
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

// 메뉴 이벤트리스너
const menuEl = document.querySelector('.menu')
const footerEl = document.querySelector('.footer')
const signinEl = footerEl.querySelector('.signin')
const signupEl = footerEl.querySelector('.signup')

signinEl.addEventListener('click', e=>{
  loginForm()
})

// 로고 클릭 시 메인 페이지로 이동
const logoEl = document.querySelector('.logo')

logoEl.addEventListener('click', e => {
  e.preventDefault()
  menuEl.classList.remove('act')
  rootEl.textContent = ''
  drawMain()
})

// 메뉴바 클릭 이벤트 리스너
const barEl = document.querySelector('.menu .menubar')
barEl.addEventListener('click', e=> {
  e.preventDefault()
  if(menuEl.classList.contains('act')){
      menuEl.classList.remove('act')
  }else{
      menuEl.classList.add('act')
  }
})
// 상품 목록 페이지 이동 이벤트리스너
const categoryEl = document.querySelector('.menu .category')
const bearEl = categoryEl.querySelector('.bear')
const kuEl = categoryEl.querySelector('.ku')
const legoEl = categoryEl.querySelector('.lego')
const cartEl = categoryEl.querySelector('.cart')
const orderedEl = categoryEl.querySelector('.ordered')
const aboutEl = categoryEl.querySelector('.about')

bearEl.addEventListener('click', e=>{
  menuEl.classList.remove('act')
  rootEl.textContent=''
  productList('bearbrick')
})

kuEl.addEventListener('click', e=>{
  menuEl.classList.remove('act')
  rootEl.textContent=''
  productList('kubrick')
})

legoEl.addEventListener('click', e=>{
  menuEl.classList.remove('act')
  rootEl.textContent=''
  productList('brickheadz')
})

cartEl.addEventListener('click', e=>{
  e.preventDefault()
  menuEl.classList.remove('act')
  rootEl.textContent=''
  drawCart()
})

orderedEl.addEventListener('click', e=>{
  e.preventDefault()
  menuEl.classList.remove('act')
  rootEl.textContent=''
  drawOrder()
})

// 페이지 로드 시 그릴 화면
drawMain()

// 장바구니에 담기전에 내가 담았던 아이템들을 불러와보고, 비교해서 있으면 안넣는다. 어쨌든 비교하는 방법 밖에 없음
