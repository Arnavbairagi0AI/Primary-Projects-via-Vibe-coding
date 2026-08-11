package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.local.AppDatabase
import com.example.data.repository.GymRepository
import com.example.ui.GymViewModel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    if (com.google.firebase.FirebaseApp.getApps(context).isEmpty()) {
      com.google.firebase.FirebaseApp.initializeApp(context)
    }
  }

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("GymMaster Pro", appName)
  }

  @Test
  fun `test viewmodel initialization`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val db = AppDatabase.getDatabase(context)
    assertNotNull(db)
    val repository = GymRepository(db.gymDao())
    assertNotNull(repository)
    val viewModel = GymViewModel(repository, context)
    assertNotNull(viewModel)
  }

  @Test
  fun `test save and load payments`() = kotlinx.coroutines.runBlocking {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val db = AppDatabase.getDatabase(context)
    val repository = GymRepository(db.gymDao())
    
    val payment = com.example.data.model.Payment(
      paymentId = 1,
      memberId = "M-101",
      memberName = "John Doe",
      amount = 1500.0,
      paymentMethod = "UPI",
      date = "2026-07-14",
      planName = "Gold Membership",
      status = "Paid",
      transactionId = "TXN-999",
      type = "renewal"
    )
    
    repository.savePayment(payment)
    val payments = repository.getPaymentsForMemberDirect("M-101")
    assertEquals(1, payments.size)
    assertEquals("John Doe", payments[0].memberName)
    assertEquals(1500.0, payments[0].amount, 0.1)
    assertEquals("Paid", payments[0].status)
  }
}
