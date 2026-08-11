package com.example.ui.hooks

import androidx.compose.runtime.*
import com.example.data.model.Member
import com.example.ui.GymViewModel

class GenerateMemberPlanState(
    val isLoading: Boolean,
    val error: String?,
    val isSuccess: Boolean,
    val generatePlan: (Member) -> Unit
)

@Composable
fun useGenerateMemberPlan(viewModel: GymViewModel, memberId: String): GenerateMemberPlanState {
    val isLoading = viewModel.smartCoachLoading[memberId] ?: false
    val error = viewModel.smartCoachError[memberId]
    val isSuccess = viewModel.smartCoachSuccess[memberId] ?: false

    val generatePlan: (Member) -> Unit = remember(viewModel) {
        { member ->
            viewModel.generateSmartCoachPlan(member)
        }
    }

    return remember(isLoading, error, isSuccess, generatePlan) {
        GenerateMemberPlanState(
            isLoading = isLoading,
            error = error,
            isSuccess = isSuccess,
            generatePlan = generatePlan
        )
    }
}
